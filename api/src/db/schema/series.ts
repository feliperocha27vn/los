import { index, integer, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { users } from './users'

export const seriesStateEnum = pgEnum('series_state', ['watching', 'paused', 'finished'])

export const series = pgTable(
  'series',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    name: text('name').notNull(),
    state: seriesStateEnum('state').notNull().default('watching'),
    // Marcador: ponto de retomada (temporada/episódio/minutagem de onde voltar),
    // nunca o último ponto assistido. Ao terminar um episódio o marcador passa
    // para o episódio seguinte com position_seconds = 0.
    season: integer('season').notNull().default(1),
    episode: integer('episode').notNull().default(1),
    positionSeconds: integer('position_seconds').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    userStateUpdatedIdx: index('series_user_id_state_updated_at_idx').on(
      table.userId,
      table.state,
      table.updatedAt,
    ),
  }),
)
