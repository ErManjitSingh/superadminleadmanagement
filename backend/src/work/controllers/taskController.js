const asyncHandler = require('../../utils/asyncHandler');
const taskService = require('../services/taskService');

const context = (req) => ({
  companyId: req.companyId,
  actor: req.user,
  workAccess: req.workAccess,
  ip: req.ip,
});

const createTask = asyncHandler(async (req, res) => {
  const task = await taskService.createTask({ ...context(req), payload: req.body });
  res.status(201).json({ success: true, task });
});

const listTasks = asyncHandler(async (req, res) => {
  const result = await taskService.listTasks({ ...context(req), query: req.query });
  res.json({ success: true, ...result });
});

const getTask = asyncHandler(async (req, res) => {
  const task = await taskService.getTask({ ...context(req), taskId: req.params.taskId });
  res.json({ success: true, task });
});

const updateTask = asyncHandler(async (req, res) => {
  const task = await taskService.updateTask({
    ...context(req),
    taskId: req.params.taskId,
    payload: req.body,
  });
  res.json({ success: true, task });
});

const moveTask = asyncHandler(async (req, res) => {
  const task = await taskService.moveTask({
    ...context(req),
    taskId: req.params.taskId,
    payload: req.body,
  });
  res.json({ success: true, task });
});

const deleteTask = asyncHandler(async (req, res) => {
  await taskService.deleteTask({ ...context(req), taskId: req.params.taskId });
  res.status(204).send();
});

const getBoard = asyncHandler(async (req, res) => {
  const board = await taskService.getBoard({
    ...context(req),
    projectId: req.query.projectId,
  });
  res.json({ success: true, ...board });
});

const createSubTask = asyncHandler(async (req, res) => {
  const subtask = await taskService.createSubTask({
    ...context(req),
    taskId: req.params.taskId,
    payload: req.body,
  });
  res.status(201).json({ success: true, subtask });
});

const updateSubTask = asyncHandler(async (req, res) => {
  const subtask = await taskService.updateSubTask({
    ...context(req),
    taskId: req.params.taskId,
    subTaskId: req.params.subTaskId,
    payload: req.body,
  });
  res.json({ success: true, subtask });
});

const deleteSubTask = asyncHandler(async (req, res) => {
  await taskService.deleteSubTask({
    ...context(req),
    taskId: req.params.taskId,
    subTaskId: req.params.subTaskId,
  });
  res.status(204).send();
});

module.exports = {
  createSubTask,
  createTask,
  deleteSubTask,
  deleteTask,
  getBoard,
  getTask,
  listTasks,
  moveTask,
  updateSubTask,
  updateTask,
};
