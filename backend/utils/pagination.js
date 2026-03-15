export const paginate = (query, { page = 1, limit = 10 }) => {
  const skip = (page - 1) * limit;
  return query.skip(skip).limit(limit);
};

/* Example Usage:
const tasksQuery = Task.find({ workspace: workspaceId });
const tasks = await paginate(tasksQuery, { page: req.query.page, limit: req.query.limit });
*/