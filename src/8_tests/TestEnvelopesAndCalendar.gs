function smoke_appsheet_getSettings_envelope() {
  const x = appsheet_getSettings();
  if (!x || x.success !== true || !x.data) throw new Error('getSettings envelope invalid');
}

function smoke_appsheet_getCalendarEvents_shape() {
  const res = appsheet_getCalendarEvents({});
  if (!res.success || !res.data || !Array.isArray(res.data.events)) throw new Error('events missing');
  res.data.events.forEach(ev => {
    if (!ev.id || !ev.start) throw new Error('event missing id/start');
    if (!ev.extendedProps || !ev.extendedProps.taskId) throw new Error('missing extendedProps.taskId');
  });
}

function smoke_mutation_purges_cache() {
  const t = appsheet_createTask({ title: 'CacheTest' });
  if (!t.success) throw new Error('create failed');
  // Implement a tiny getter that reads ScriptCache by key, or rely on getAllTasks path:
  const payload = CacheService.getScriptCache().get('all_tasks_payload');
  if (payload) throw new Error('ScriptCache not purged after create');
}