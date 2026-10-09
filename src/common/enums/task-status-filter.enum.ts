/**
 * فلتر حالة المهام بشريط التصفية العلوي — ENUM على مستوى API فقط،
 * ليس عمودًا بقاعدة البيانات (يُبنى من is_completed و due_date).
 */
export enum TaskStatusFilter {
  ALL = 'all',
  TODAY = 'today',
  PENDING = 'pending',
  COMPLETED = 'completed',
}
