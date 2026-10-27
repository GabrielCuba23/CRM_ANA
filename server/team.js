export const INITIAL_OPERATORS = [
  'Hanz', 'Fernando', 'Acxel', 'Andrés', 'Shirley', 'Jaruska',
  'Marco', 'Alejandra', 'Marcelo', 'Luciano', 'Sheila', 'Cristina'
];
export const TEAM_ROSTER_VERSION_KEY = 'ana_operators_v1';
const LEGACY_OPERATORS = ['Marco', 'Lucía', 'Diego', 'Carla'];

// La marca y la actualización comparten una transacción. Los cambios posteriores
// que haga el equipo en su lista no vuelven a sustituirse en cada sincronización.
export async function ensureInitialOperators(db) {
  const applied = await db.prepare('SELECT config_key FROM team_config WHERE config_key=?')
    .bind(TEAM_ROSTER_VERSION_KEY).first();
  if (applied) return;
  await db.batch([
    db.prepare(`
      INSERT INTO team_config (config_key, config_value)
      SELECT 'members', (
        SELECT json_group_array(name) FROM (
          SELECT name FROM (
            SELECT value AS name, CAST(key AS INTEGER) AS position FROM json_each(?)
            UNION ALL
            SELECT previous.value AS name, 100 + CAST(previous.key AS INTEGER) AS position
            FROM json_each(COALESCE((SELECT config_value FROM team_config WHERE config_key='members'), '[]')) AS previous
            WHERE previous.value NOT IN (SELECT value FROM json_each(?))
              OR EXISTS (
                SELECT 1 FROM spaces, json_each(spaces.assignees) AS assigned
                WHERE assigned.value=previous.value
              )
              OR EXISTS (SELECT 1 FROM tasks WHERE assignee=previous.value AND done=0)
          )
          GROUP BY name ORDER BY MIN(position)
        )
      )
      WHERE NOT EXISTS (SELECT 1 FROM team_config WHERE config_key=?)
      ON CONFLICT(config_key) DO UPDATE SET config_value=excluded.config_value
    `).bind(JSON.stringify(INITIAL_OPERATORS), JSON.stringify(LEGACY_OPERATORS), TEAM_ROSTER_VERSION_KEY),
    db.prepare('INSERT OR IGNORE INTO team_config (config_key,config_value) VALUES (?,?)')
      .bind(TEAM_ROSTER_VERSION_KEY, '1')
  ]);
}
