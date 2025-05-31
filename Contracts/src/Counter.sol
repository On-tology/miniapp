// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title  MTurk‐Style Marketplace with Pool, Reputation, Classification & Ranking, and Submission Retrieval
/// @notice Supports two task types (Classification vs. Ranking), on‐chain pool funding, worker reputation,
///         and view functions to retrieve exactly what a worker submitted.
contract BlockchainMTurkWithPool_ClassAndRank {
    // ──────────────────────────────────────────────────────────────────────────────
    // 1) ENUMS & STRUCTS
    // ──────────────────────────────────────────────────────────────────────────────

    /// @notice Two types of tasks: Classification (choose from a fixed set of strings)
    ///         or Ranking (submit a numeric rating 0.0–10.0 encoded as 0–100).
    enum TaskType   { Classification, Ranking }

    /// @notice The lifecycle states of a task.
    enum TaskStatus { Open, Assigned, Submitted, Completed, Cancelled }

    /// @notice Each Task stores its metadata, current status, assigned worker, and submission fields.
    struct Task {
        uint256         id;               // Unique task ID
        address         requester;        // Who posted it
        uint256         reward;           // Wei reserved from pool
        string          description;      // Metadata or IPFS hash
        TaskType        taskType;         // Classification vs. Ranking
        TaskStatus      status;           // Current state
        address payable worker;           // Assigned worker

        bool            hasSubmission;    // True once the worker submitted
        uint8           submissionIndex;  // If Classification: index of choice
        uint8           ratingScaled;     // If Ranking: integer 0..100 (e.g. 5.7 → 57)
    }

    /// @notice Tracks how many tasks a worker accepted, completed, and the sum of ratings received.
    struct Reputation {
        uint256 assignedCount;   // # of tasks assigned
        uint256 completedCount;  // # of tasks completed & approved
        uint256 totalRating;     // sum of all 1..5 ratings from requesters
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // 2) STORAGE
    // ──────────────────────────────────────────────────────────────────────────────

    /// @notice Reputation mapping for each worker address.
    mapping(address => Reputation) public workerReputation;

    /// @notice Auto-incrementing task ID counter.
    uint256 public nextTaskId;

    /// @notice Mapping from taskId → Task struct.
    mapping(uint256 => Task) public tasks;

    /// @notice For classification tasks: taskId → array of choice‐strings.
    mapping(uint256 => string[]) private choicesForTask;

    /// @notice List of all task IDs in creation order (for iteration).
    uint256[] private taskIds;

    /// @notice Requester → on‐chain pool balance (in Wei).
    mapping(address => uint256) public poolBalance;

    // ──────────────────────────────────────────────────────────────────────────────
    // 3) EVENTS
    // ──────────────────────────────────────────────────────────────────────────────

    event Deposited(address indexed requester, uint256 amount);
    event Withdrawn(address indexed requester, uint256 amount);

    event ClassificationTaskPosted(
        uint256 indexed taskId,
        address indexed requester,
        uint256 reward,
        string[] choices
    );
    event RankingTaskPosted(
        uint256 indexed taskId,
        address indexed requester,
        uint256 reward
    );

    event TaskAssigned(uint256 indexed taskId, address indexed worker);
    event ClassificationSubmitted(uint256 indexed taskId, address indexed worker, uint8 choiceIndex);
    event RankingSubmitted(uint256 indexed taskId, address indexed worker, uint8 ratingScaled);
    event WorkApproved(uint256 indexed taskId, address indexed worker, uint8 rating);
    event TaskCancelled(uint256 indexed taskId);

    // ──────────────────────────────────────────────────────────────────────────────
    // 4) MODIFIERS
    // ──────────────────────────────────────────────────────────────────────────────

    /// @notice Only the original requester of task `_taskId` may call.
    modifier onlyRequester(uint256 _taskId) {
        require(tasks[_taskId].requester == msg.sender, "Not task requester");
        _;
    }

    /// @notice Only the worker assigned to task `_taskId` may call.
    modifier onlyWorker(uint256 _taskId) {
        require(tasks[_taskId].worker == msg.sender, "Not assigned worker");
        _;
    }

    /// @notice Ensure the task `_taskId` has not already been cancelled.
    modifier notCancelled(uint256 _taskId) {
        require(tasks[_taskId].status != TaskStatus.Cancelled, "Task is Cancelled");
        _;
    }

    /// @notice Ensure the task `_taskId` is in the Assigned state (ready for submission).
    modifier onlyWhenAssigned(uint256 _taskId) {
        require(tasks[_taskId].status == TaskStatus.Assigned, "Task not assigned");
        _;
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // 5) POOL FUNCTIONS
    // ──────────────────────────────────────────────────────────────────────────────

    /// @notice Deposit ETH into your requester‐pool (so you can post tasks later).
    function depositFunds() external payable {
        require(msg.value > 0, "Must deposit positive amount");
        poolBalance[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    /// @notice Withdraw unallocated ETH from your pool.
    function withdrawFunds(uint256 _amount) external {
        require(_amount > 0, "Amount must be > 0");
        require(poolBalance[msg.sender] >= _amount, "Insufficient pool balance");

        poolBalance[msg.sender] -= _amount;
        payable(msg.sender).transfer(_amount);
        emit Withdrawn(msg.sender, _amount);
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // 6) POSTING TASKS
    // ──────────────────────────────────────────────────────────────────────────────

    /// @notice Post a new Classification task with a predefined list of `choices`.
    /// @param _description  Some text or IPFS hash describing the job.
    /// @param _reward       How much ETH (wei) you reserve from your pool as reward.
    /// @param _choices      Array of possible classification labels (strings). Must have length ≥ 2.
    function postClassificationTask(
        string memory _description,
        uint256       _reward,
        string[]      memory _choices
    )
        external
    {
        require(_reward > 0, "Reward must be > 0");
        require(poolBalance[msg.sender] >= _reward, "Insufficient pool balance");
        require(_choices.length >= 2, "Need at least 2 choices");

        // Reserve the reward from the requester's pool
        poolBalance[msg.sender] -= _reward;

        uint256 taskId = nextTaskId;
        tasks[taskId] = Task({
            id:              taskId,
            requester:       msg.sender,
            reward:          _reward,
            description:     _description,
            taskType:        TaskType.Classification,
            status:          TaskStatus.Open,
            worker:          payable(address(0)),
            hasSubmission:   false,
            submissionIndex: 0,
            ratingScaled:    0
        });

        // Copy each choice‐string from the provided array into storage
        for (uint256 i = 0; i < _choices.length; i++) {
            choicesForTask[taskId].push(_choices[i]);
        }

        // Record the new task ID so we can iterate later
        taskIds.push(taskId);
        nextTaskId++;

        emit ClassificationTaskPosted(taskId, msg.sender, _reward, _choices);
    }

    /// @notice Post a new Ranking task (no choice‐list).  Workers return a 0.0–10.0 “rating”.
    /// @param _description  Some text or IPFS hash describing the job.
    /// @param _reward       How much ETH (wei) you reserve from your pool as reward.
    function postRankingTask(
        string memory _description,
        uint256       _reward
    )
        external
    {
        require(_reward > 0, "Reward must be > 0");
        require(poolBalance[msg.sender] >= _reward, "Insufficient pool balance");

        // Reserve the reward from the requester’s pool
        poolBalance[msg.sender] -= _reward;

        uint256 taskId = nextTaskId;
        tasks[taskId] = Task({
            id:              taskId,
            requester:       msg.sender,
            reward:          _reward,
            description:     _description,
            taskType:        TaskType.Ranking,
            status:          TaskStatus.Open,
            worker:          payable(address(0)),
            hasSubmission:   false,
            submissionIndex: 0,
            ratingScaled:    0
        });

        taskIds.push(taskId);
        nextTaskId++;

        emit RankingTaskPosted(taskId, msg.sender, _reward);
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // 7) ACCEPTING A TASK
    // ──────────────────────────────────────────────────────────────────────────────

    /// @notice Worker accepts an open task.  Increases assignedCount for reputation.
    function acceptTask(uint256 _taskId)
        external
        notCancelled(_taskId)
    {
        Task storage t = tasks[_taskId];
        require(t.status == TaskStatus.Open, "Task not open");
        require(msg.sender != t.requester, "Requester cannot be worker");

        t.worker = payable(msg.sender);
        t.status = TaskStatus.Assigned;

        // Bump this worker’s assignedCount (for reputation/trust)
        workerReputation[msg.sender].assignedCount += 1;

        emit TaskAssigned(_taskId, msg.sender);
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // 8) SUBMITTING WORK
    // ──────────────────────────────────────────────────────────────────────────────

    /// @notice Submit a classification choice.  Only valid if `taskType == Classification`.
    /// @param _taskId       The ID of the classification task.
    /// @param _choiceIndex  The index ∈ [0 .. choicesForTask[taskId].length-1].
    function submitClassificationWork(uint256 _taskId, uint8 _choiceIndex)
        external
        onlyWorker(_taskId)
        notCancelled(_taskId)
        onlyWhenAssigned(_taskId)
    {
        Task storage t = tasks[_taskId];
        require(t.taskType == TaskType.Classification, "Not a classification task");
        require(!t.hasSubmission,                   "Already submitted");

        uint256 numChoices = choicesForTask[_taskId].length;
        require(_choiceIndex < numChoices, "Invalid choice index");

        t.submissionIndex = _choiceIndex;
        t.hasSubmission   = true;
        t.status          = TaskStatus.Submitted;

        emit ClassificationSubmitted(_taskId, msg.sender, _choiceIndex);
    }

    /// @notice Submit a ranking “score” between 0.0–10.0, encoded as an integer [0..100].
    /// @param _taskId        The ID of the ranking task.
    /// @param _ratingScaled  An integer ∈ [0..100], e.g. 57 means 5.7/10.
    function submitRankingWork(uint256 _taskId, uint8 _ratingScaled)
        external
        onlyWorker(_taskId)
        notCancelled(_taskId)
        onlyWhenAssigned(_taskId)
    {
        Task storage t = tasks[_taskId];
        require(t.taskType == TaskType.Ranking,  "Not a ranking task");
        require(!t.hasSubmission,                 "Already submitted");
        require(_ratingScaled <= 100,             "Rating must be 0..100");

        t.ratingScaled  = _ratingScaled;
        t.hasSubmission = true;
        t.status        = TaskStatus.Submitted;

        emit RankingSubmitted(_taskId, msg.sender, _ratingScaled);
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // 9) APPROVING WORK & UPDATING REPUTATION
    // ──────────────────────────────────────────────────────────────────────────────

    /// @notice Requester approves submitted work (classification or ranking).  
    ///         Must supply a 1..5 “quality rating” which factors into the worker’s reputation.
    function approveWork(uint256 _taskId, uint8 _rating)
        external
        onlyRequester(_taskId)
        notCancelled(_taskId)
    {
        Task storage t = tasks[_taskId];

        // 1) Ensure there *is* a submission
        require(t.status == TaskStatus.Submitted, "Work not submitted");
        require(t.hasSubmission,            "No submission found");

        // 2) Ensure rating is valid
        require(_rating >= 1 && _rating <= 5, "Rating must be 1..5");

        // 3) Mark Completed and pay the worker
        t.status       = TaskStatus.Completed;
        uint256 payment = t.reward;
        address payable w = t.worker;

        // Zero out reward before transferring to prevent re-entrancy
        t.reward = 0;
        w.transfer(payment);

        // 4) Update worker reputation
        workerReputation[w].completedCount += 1;
        workerReputation[w].totalRating   += _rating;

        emit WorkApproved(_taskId, w, _rating);
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // 10) CANCEL A TASK
    // ──────────────────────────────────────────────────────────────────────────────

    function cancelTask(uint256 _taskId)
        external
        onlyRequester(_taskId)
    {
        Task storage t = tasks[_taskId];

        // You can only cancel if it’s still Open
        require(t.status == TaskStatus.Open, "Can only cancel Open tasks");

        t.status = TaskStatus.Cancelled;
        uint256 refund = t.reward;
        t.reward = 0;

        // Refund the requester’s pool balance
        poolBalance[msg.sender] += refund;

        emit TaskCancelled(_taskId);
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // 11) VIEW FUNCTIONS
    // ──────────────────────────────────────────────────────────────────────────────

    /// @notice Get a single task’s data (including type, status, and submission fields).
    function getTask(uint256 _taskId)
        external
        view
        returns (
            uint256      id,
            address      requester,
            uint256      reward,
            string memory description,
            TaskType     taskType,
            TaskStatus   status,
            address      worker,
            bool         hasSubmission,
            uint8        submissionIndex,
            uint8        ratingScaled
        )
    {
        Task storage t = tasks[_taskId];
        return (
            t.id,
            t.requester,
            t.reward,
            t.description,
            t.taskType,
            t.status,
            t.worker,
            t.hasSubmission,
            t.submissionIndex,
            t.ratingScaled
        );
    }

    /// @notice Return all choice‐strings for a classification task.  Reverts if not a classification task.
    function getChoices(uint256 _taskId) external view returns (string[] memory) {
        Task storage t = tasks[_taskId];
        require(t.taskType == TaskType.Classification, "Not a classification task");
        return choicesForTask[_taskId];
    }

    /// @notice Returns an array of *all* Task structs (in creation order).
    /// @dev For large arrays, this can become expensive on-chain.
    function getAllTasks() external view returns (Task[] memory) {
        uint256 total = taskIds.length;
        Task[] memory arr = new Task[](total);
        for (uint256 i = 0; i < total; i++) {
            uint256 id = taskIds[i];
            arr[i] = tasks[id];
        }
        return arr;
    }

    /// @notice Returns the total number of tasks posted so far.
    function getTotalTasks() external view returns (uint256) {
        return taskIds.length;
    }

    /// @notice Returns the taskId at a given index (0-based) in creation order.
    /// @dev Front-ends can loop from 0..getTotalTasks()-1 and call getTask(id).
    function getTaskIdByIndex(uint256 index) external view returns (uint256) {
        require(index < taskIds.length, "Index out of bounds");
        return taskIds[index];
    }

    /// @notice Return the raw submission data for a given task.
    /// @param _taskId  The ID of the task whose submission we want to see.
    /// @return wasSubmitted  = true if the worker actually called submit…  
    /// @return choiceIndex   = if Classification, the uint8 index the worker chose; otherwise 0  
    /// @return choiceString  = if Classification, the actual string (e.g. "cat"); otherwise ""  
    /// @return ratingScaled  = if Ranking, the 0..100 integer rating they submitted; otherwise 0
    function getSubmittedWork(uint256 _taskId)
        external
        view
        returns (
            bool    wasSubmitted,
            uint8   choiceIndex,
            string memory choiceString,
            uint8   ratingScaled
        )
    {
        Task storage t = tasks[_taskId];

        // 1) If nothing was submitted, return defaults.
        if (!t.hasSubmission) {
            return (false, 0, "", 0);
        }

        // 2) If it’s a Classification task, return the stored index + the actual string.
        if (t.taskType == TaskType.Classification) {
            uint8 idx = t.submissionIndex;
            string memory s = choicesForTask[_taskId][idx];
            return (true, idx, s, 0);
        }

        // 3) Otherwise it's a Ranking task. Return ratingScaled.
        return (true, 0, "", t.ratingScaled);
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // 12) REPUTATION FUNCTIONS
    // ──────────────────────────────────────────────────────────────────────────────

    /// @notice Returns worker’s composite reputation (0..500) → interpret as 0.00..5.00.
    function getWorkerReputation(address _worker) public view returns (uint256) {
        Reputation storage rep = workerReputation[_worker];

        // If never assigned any tasks, return 0
        if (rep.assignedCount == 0) {
            return 0;
        }

        uint256 completed = rep.completedCount;   // n_j^completed
        uint256 assigned  = rep.assignedCount;    // n_j^assigned
        uint256 totalR    = rep.totalRating;      // sum of all raw 1..5 ratings

        // 1) Compute averageQualityScaled = (totalR * 100) / completed  ∈ [100..500], or 0 if completed = 0
        uint256 avgQualityScaled;
        if (completed == 0) {
            avgQualityScaled = 0;
        } else {
            avgQualityScaled = (totalR * 100) / completed; // scale = 100
        }

        // 2) Compute reliabilityScaled = (completed * 100) / assigned  ∈ [0..100]
        uint256 reliabilityScaled = (completed * 100) / assigned;

        // 3) Map that into a [0..500] scale by multiplying by 5
        uint256 scaledReliabilityAsFive = reliabilityScaled * 5; // ∈ [0..500]

        // 4) Choose αScaled = 70 (i.e. 70% weight on Quality, 30% on Reliability×5)
        uint256 alphaScaled = 70;

        // 5) Compute weightedQuality = αScaled * avgQualityScaled  ∈ [0..35000]
        //    Compute weightedReliability = (100 − αScaled) * scaledReliabilityAsFive  ∈ [0..15000]
        uint256 weightedQuality     = alphaScaled * avgQualityScaled;
        uint256 weightedReliability = (100 - alphaScaled) * scaledReliabilityAsFive;

        // 6) Combine & divide by 100 → final ∈ [0..500]
        uint256 combined = (weightedQuality + weightedReliability) / 100;
        return combined;
    }

    /// @notice Return raw assignedCount, completedCount, totalRating for a given worker.
    /// @dev Reverts if the worker has never been assigned or completed any tasks.
    function getWorkerReputationRaw(address _worker)
        external
        view
        returns (
            uint256 assignedCount,
            uint256 completedCount,
            uint256 totalRating
        )
    {
        Reputation storage rep = workerReputation[_worker];

        require(
            rep.assignedCount > 0 || rep.completedCount > 0,
            "No such worker"
        );

        return (rep.assignedCount, rep.completedCount, rep.totalRating);
    }
}