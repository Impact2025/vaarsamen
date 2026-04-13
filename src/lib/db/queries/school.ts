import { db } from '@/lib/db'
import {
  sailingSchools, schoolMemberships, schoolCourses, schoolFleet,
  schoolLessons, lessonStudents, skillDefinitions, skillAssessments, lessonNotes,
  users,
} from '@/lib/db/schema'
import { and, eq, isNull, desc, count, inArray, asc, sql } from 'drizzle-orm'

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type SkillScore = 'aangeboden' | 'matig' | 'redelijk' | 'beheerst'

export type SchoolWithRole = typeof sailingSchools.$inferSelect & {
  role: 'eigenaar' | 'instructeur' | 'cursist'
}

export type LesDetailResult = {
  les: typeof schoolLessons.$inferSelect & {
    course: typeof schoolCourses.$inferSelect
    instructeurNaam: string | null
  }
  fleet:    typeof schoolFleet.$inferSelect[]
  skills:   typeof skillDefinitions.$inferSelect[]
  students: StudentLesData[]
}

export type StudentLesData = {
  userId:      string
  naam:        string | null
  image:       string | null
  bootId:      string | null
  bootNummer:  string | null
  soloGevaren: boolean
  scores:      Record<string, SkillScore>  // skillId → score
  note:        string | null
}

export type VorderingenResult = {
  school:  typeof sailingSchools.$inferSelect
  course:  typeof schoolCourses.$inferSelect
  skills:  typeof skillDefinitions.$inferSelect[]
  lessen:  LesVorderingData[]
}

export type LesVorderingData = {
  lesId:           string
  datum:           string
  windRichting:    string | null
  windKracht:      number | null
  bootNummer:      string | null
  soloGevaren:     boolean
  instructeurNaam: string | null
  scores:          Record<string, SkillScore>  // skillId → score
  note:            string | null
}

// ─── SCHOOL LOOKUP ────────────────────────────────────────────────────────────

export async function getSchoolBySlug(slug: string) {
  const [school] = await db
    .select()
    .from(sailingSchools)
    .where(and(eq(sailingSchools.slug, slug), isNull(sailingSchools.deletedAt)))
    .limit(1)
  return school ?? null
}

export async function getSchoolById(id: string) {
  const [school] = await db
    .select()
    .from(sailingSchools)
    .where(and(eq(sailingSchools.id, id), isNull(sailingSchools.deletedAt)))
    .limit(1)
  return school ?? null
}

// ─── MEMBERSHIP ───────────────────────────────────────────────────────────────

export async function getSchoolMembership(schoolId: string, userId: string) {
  const [membership] = await db
    .select()
    .from(schoolMemberships)
    .where(and(
      eq(schoolMemberships.schoolId, schoolId),
      eq(schoolMemberships.userId, userId),
      isNull(schoolMemberships.deletedAt),
    ))
    .limit(1)
  return membership ?? null
}

export async function getMySchools(userId: string): Promise<SchoolWithRole[]> {
  const rows = await db
    .select({ school: sailingSchools, role: schoolMemberships.role })
    .from(schoolMemberships)
    .innerJoin(sailingSchools, eq(schoolMemberships.schoolId, sailingSchools.id))
    .where(and(
      eq(schoolMemberships.userId, userId),
      isNull(schoolMemberships.deletedAt),
      isNull(sailingSchools.deletedAt),
    ))
    .orderBy(sailingSchools.name)

  return rows.map(r => ({ ...r.school, role: r.role }))
}

// ─── SCHOOL DASHBOARD ─────────────────────────────────────────────────────────

export type SchoolDashboardData = {
  school:       typeof sailingSchools.$inferSelect
  courses:      CourseWithStats[]
  recenteLessen: RecenteLes[]
  stats: {
    totaalCursisten:   number
    totaalInstructeurs: number
    totaalLessen:      number
    totaalCursussen:   number
  }
}

export type CourseWithStats = typeof schoolCourses.$inferSelect & {
  aantalLessen:   number
  aantalCursisten: number
}

export type RecenteLes = typeof schoolLessons.$inferSelect & {
  cursusNaam:      string
  aantalCursisten: number
  instructeurNaam: string | null
}

export async function getSchoolDashboard(schoolId: string): Promise<SchoolDashboardData | null> {
  const school = await getSchoolById(schoolId)
  if (!school) return null

  // Courses met counts
  const courseRows = await db
    .select({
      course:         schoolCourses,
      aantalLessen:   count(schoolLessons.id).as('aantal_lessen'),
    })
    .from(schoolCourses)
    .leftJoin(schoolLessons, and(
      eq(schoolLessons.courseId, schoolCourses.id),
      isNull(schoolLessons.deletedAt),
    ))
    .where(and(eq(schoolCourses.schoolId, schoolId), isNull(schoolCourses.deletedAt)))
    .groupBy(schoolCourses.id)
    .orderBy(asc(schoolCourses.name))

  // Cursisten per cursus — single query met GROUP BY (geen N+1)
  const courseIds = courseRows.map(r => r.course.id)
  const cursistenPerCursus: Record<string, number> = {}
  if (courseIds.length > 0) {
    const cursistenRows = await db
      .select({
        courseId: schoolLessons.courseId,
        n: sql<number>`count(distinct ${lessonStudents.studentUserId})`.as('n'),
      })
      .from(schoolLessons)
      .innerJoin(lessonStudents, eq(lessonStudents.lessonId, schoolLessons.id))
      .where(and(inArray(schoolLessons.courseId, courseIds), isNull(schoolLessons.deletedAt)))
      .groupBy(schoolLessons.courseId)

    for (const r of cursistenRows) {
      cursistenPerCursus[r.courseId] = Number(r.n)
    }
  }

  const courses: CourseWithStats[] = courseRows.map(r => ({
    ...r.course,
    aantalLessen:    Number(r.aantalLessen),
    aantalCursisten: cursistenPerCursus[r.course.id] ?? 0,
  }))

  // Recente lessen (laatste 10)
  const recentRows = await db
    .select({
      les:            schoolLessons,
      cursusNaam:     schoolCourses.name,
      instructeurNaam: users.name,
    })
    .from(schoolLessons)
    .innerJoin(schoolCourses, eq(schoolLessons.courseId, schoolCourses.id))
    .leftJoin(users, eq(schoolLessons.instructeurId, users.id))
    .where(and(eq(schoolLessons.schoolId, schoolId), isNull(schoolLessons.deletedAt)))
    .orderBy(desc(schoolLessons.datum), desc(schoolLessons.createdAt))
    .limit(10)

  // Cursistenaantallen per les — single query met GROUP BY (geen N+1)
  const recentLessonIds = recentRows.map(r => r.les.id)
  const countMap: Record<string, number> = {}
  if (recentLessonIds.length > 0) {
    const countRows = await db
      .select({ lessonId: lessonStudents.lessonId, n: count() })
      .from(lessonStudents)
      .where(inArray(lessonStudents.lessonId, recentLessonIds))
      .groupBy(lessonStudents.lessonId)
    for (const r of countRows) countMap[r.lessonId] = Number(r.n)
  }

  const recenteLessen: RecenteLes[] = recentRows.map(r => ({
    ...r.les,
    cursusNaam:      r.cursusNaam,
    aantalCursisten: countMap[r.les.id] ?? 0,
    instructeurNaam: r.instructeurNaam ?? null,
  }))

  // Stats
  const [memberStats] = await db
    .select({
      cursisten:    count(),
    })
    .from(schoolMemberships)
    .where(and(
      eq(schoolMemberships.schoolId, schoolId),
      eq(schoolMemberships.role, 'cursist'),
      isNull(schoolMemberships.deletedAt),
    ))

  const [instructeurStats] = await db
    .select({ n: count() })
    .from(schoolMemberships)
    .where(and(
      eq(schoolMemberships.schoolId, schoolId),
      eq(schoolMemberships.role, 'instructeur'),
      isNull(schoolMemberships.deletedAt),
    ))

  const [lesStats] = await db
    .select({ n: count() })
    .from(schoolLessons)
    .where(and(eq(schoolLessons.schoolId, schoolId), isNull(schoolLessons.deletedAt)))

  return {
    school,
    courses,
    recenteLessen,
    stats: {
      totaalCursisten:    Number(memberStats?.cursisten ?? 0),
      totaalInstructeurs: Number(instructeurStats?.n ?? 0),
      totaalLessen:       Number(lesStats?.n ?? 0),
      totaalCursussen:    courses.length,
    },
  }
}

// ─── LES DETAIL ───────────────────────────────────────────────────────────────
// Volledige data voor de instructeur tablet UI

export async function getLesDetail(lesId: string): Promise<LesDetailResult | null> {
  // Les + cursus
  const [lesRow] = await db
    .select({
      les:            schoolLessons,
      course:         schoolCourses,
      instructeurNaam: users.name,
    })
    .from(schoolLessons)
    .innerJoin(schoolCourses, eq(schoolLessons.courseId, schoolCourses.id))
    .leftJoin(users, eq(schoolLessons.instructeurId, users.id))
    .where(and(eq(schoolLessons.id, lesId), isNull(schoolLessons.deletedAt)))
    .limit(1)

  if (!lesRow) return null

  // Vloot van de school
  const fleet = await db
    .select()
    .from(schoolFleet)
    .where(and(eq(schoolFleet.schoolId, lesRow.les.schoolId), isNull(schoolFleet.deletedAt)))
    .orderBy(schoolFleet.bootNummer)

  // Vaardigheden voor dit CWO niveau
  const skills = await db
    .select()
    .from(skillDefinitions)
    .where(eq(skillDefinitions.cwoLevel, lesRow.course.cwoLevel ?? 'cwo_kielboot2'))
    .orderBy(asc(skillDefinitions.sortOrder))

  // Cursisten op deze les
  const studentRows = await db
    .select({
      lessonStudent: lessonStudents,
      user:          users,
      bootNummer:    schoolFleet.bootNummer,
    })
    .from(lessonStudents)
    .innerJoin(users, eq(lessonStudents.studentUserId, users.id))
    .leftJoin(schoolFleet, eq(lessonStudents.bootId, schoolFleet.id))
    .where(eq(lessonStudents.lessonId, lesId))
    .orderBy(users.name)

  if (studentRows.length === 0) {
    return {
      les: { ...lesRow.les, course: lesRow.course, instructeurNaam: lesRow.instructeurNaam ?? null },
      fleet,
      skills,
      students: [],
    }
  }

  const studentUserIds = studentRows.map(r => r.user.id)

  // Bestaande beoordelingen voor alle cursisten op deze les
  const assessmentRows = await db
    .select()
    .from(skillAssessments)
    .where(and(
      eq(skillAssessments.lessonId, lesId),
      inArray(skillAssessments.studentUserId, studentUserIds),
    ))

  // Bestaande opmerkingen
  const noteRows = await db
    .select()
    .from(lessonNotes)
    .where(and(
      eq(lessonNotes.lessonId, lesId),
      inArray(lessonNotes.studentUserId, studentUserIds),
    ))

  // Pivot: per student → scores map + note
  const scoresByStudent: Record<string, Record<string, SkillScore>> = {}
  for (const a of assessmentRows) {
    scoresByStudent[a.studentUserId] ??= {}
    scoresByStudent[a.studentUserId][a.skillId] = a.score as SkillScore
  }

  const noteByStudent: Record<string, string> = {}
  for (const n of noteRows) {
    noteByStudent[n.studentUserId] = n.note
  }

  const students: StudentLesData[] = studentRows.map(r => ({
    userId:      r.user.id,
    naam:        r.user.name,
    image:       r.user.image,
    bootId:      r.lessonStudent.bootId,
    bootNummer:  r.bootNummer ?? null,
    soloGevaren: r.lessonStudent.soloGevaren ?? false,
    scores:      scoresByStudent[r.user.id] ?? {},
    note:        noteByStudent[r.user.id] ?? null,
  }))

  return {
    les: { ...lesRow.les, course: lesRow.course, instructeurNaam: lesRow.instructeurNaam ?? null },
    fleet,
    skills,
    students,
  }
}

// ─── MIJN VORDERINGEN ────────────────────────────────────────────────────────
// Volledige vorderingenstaat voor één cursist (pivot: skills × lessen)

export async function getMijnVorderingen(
  userId: string,
  schoolId?: string,
): Promise<VorderingenResult[]> {
  // Vind alle lessen waar deze cursist op stond
  const studentLesRows = await db
    .select({
      lessonStudent: lessonStudents,
      les:           schoolLessons,
      course:        schoolCourses,
      school:        sailingSchools,
      bootNummer:    schoolFleet.bootNummer,
      instructeurNaam: users.name,
    })
    .from(lessonStudents)
    .innerJoin(schoolLessons,  eq(lessonStudents.lessonId, schoolLessons.id))
    .innerJoin(schoolCourses,  eq(schoolLessons.courseId,  schoolCourses.id))
    .innerJoin(sailingSchools, eq(schoolLessons.schoolId,  sailingSchools.id))
    .leftJoin(schoolFleet,     eq(lessonStudents.bootId,   schoolFleet.id))
    .leftJoin(users,           eq(schoolLessons.instructeurId, users.id))
    .where(and(
      eq(lessonStudents.studentUserId, userId),
      isNull(schoolLessons.deletedAt),
      isNull(sailingSchools.deletedAt),
      ...(schoolId ? [eq(schoolLessons.schoolId, schoolId)] : []),
    ))
    .orderBy(asc(schoolLessons.datum))

  if (studentLesRows.length === 0) return []

  const lessonIds = studentLesRows.map(r => r.les.id)

  // Alle beoordelingen voor deze cursist over alle lessen
  const assessments = await db
    .select()
    .from(skillAssessments)
    .where(and(
      eq(skillAssessments.studentUserId, userId),
      inArray(skillAssessments.lessonId, lessonIds),
    ))

  // Alle opmerkingen
  const notes = await db
    .select()
    .from(lessonNotes)
    .where(and(
      eq(lessonNotes.studentUserId, userId),
      inArray(lessonNotes.lessonId, lessonIds),
    ))

  const scoresByLesson: Record<string, Record<string, SkillScore>> = {}
  for (const a of assessments) {
    scoresByLesson[a.lessonId] ??= {}
    scoresByLesson[a.lessonId][a.skillId] = a.score as SkillScore
  }

  const noteByLesson: Record<string, string> = {}
  for (const n of notes) {
    noteByLesson[n.lessonId] = n.note
  }

  // Groepeer per cursus
  const cursusMap = new Map<string, {
    school: typeof sailingSchools.$inferSelect
    course: typeof schoolCourses.$inferSelect
    lessen: LesVorderingData[]
  }>()

  for (const r of studentLesRows) {
    if (!cursusMap.has(r.course.id)) {
      cursusMap.set(r.course.id, { school: r.school, course: r.course, lessen: [] })
    }
    cursusMap.get(r.course.id)!.lessen.push({
      lesId:           r.les.id,
      datum:           r.les.datum,
      windRichting:    r.les.windRichting,
      windKracht:      r.les.windKracht,
      bootNummer:      r.bootNummer ?? null,
      soloGevaren:     r.lessonStudent.soloGevaren ?? false,
      instructeurNaam: r.instructeurNaam ?? null,
      scores:          scoresByLesson[r.les.id] ?? {},
      note:            noteByLesson[r.les.id] ?? null,
    })
  }

  // Voeg skills toe per cursus (op CWO niveau)
  const cwoLevels = [...new Set([...cursusMap.values()].map(v => v.course.cwoLevel ?? 'cwo_kielboot2'))]
  const allSkills = await db
    .select()
    .from(skillDefinitions)
    .where(inArray(skillDefinitions.cwoLevel, cwoLevels as ('geen' | 'cwo1' | 'cwo2' | 'cwo3' | 'cwo4' | 'cwo_kielboot1' | 'cwo_kielboot2' | 'cwo_kielboot3')[]))
    .orderBy(asc(skillDefinitions.sortOrder))

  const skillsByCwoLevel: Record<string, typeof skillDefinitions.$inferSelect[]> = {}
  for (const s of allSkills) {
    skillsByCwoLevel[s.cwoLevel] ??= []
    skillsByCwoLevel[s.cwoLevel].push(s)
  }

  return [...cursusMap.values()].map(v => ({
    school:  v.school,
    course:  v.course,
    skills:  skillsByCwoLevel[v.course.cwoLevel ?? 'cwo_kielboot2'] ?? [],
    lessen:  v.lessen,
  }))
}

// ─── SCHOOL LEDEN ─────────────────────────────────────────────────────────────

export type SchoolLid = {
  userId:   string
  naam:     string | null
  email:    string
  image:    string | null
  role:     'eigenaar' | 'instructeur' | 'cursist'
  joinedAt: Date | null
}

export async function getSchoolLeden(schoolId: string): Promise<SchoolLid[]> {
  const rows = await db
    .select({
      user:     users,
      role:     schoolMemberships.role,
      joinedAt: schoolMemberships.joinedAt,
    })
    .from(schoolMemberships)
    .innerJoin(users, eq(schoolMemberships.userId, users.id))
    .where(and(
      eq(schoolMemberships.schoolId, schoolId),
      isNull(schoolMemberships.deletedAt),
    ))
    .orderBy(schoolMemberships.role, users.name)

  return rows.map(r => ({
    userId:   r.user.id,
    naam:     r.user.name,
    email:    r.user.email,
    image:    r.user.image,
    role:     r.role,
    joinedAt: r.joinedAt,
  }))
}

// ─── LESSEN VAN EEN CURSUS ────────────────────────────────────────────────────

export type LesOverzicht = typeof schoolLessons.$inferSelect & {
  aantalCursisten: number
  instructeurNaam: string | null
}

export async function getLessenVoorCursus(courseId: string): Promise<LesOverzicht[]> {
  const rows = await db
    .select({
      les:            schoolLessons,
      instructeurNaam: users.name,
    })
    .from(schoolLessons)
    .leftJoin(users, eq(schoolLessons.instructeurId, users.id))
    .where(and(eq(schoolLessons.courseId, courseId), isNull(schoolLessons.deletedAt)))
    .orderBy(asc(schoolLessons.datum))

  // Cursistenaantallen — single query met GROUP BY (geen N+1)
  const lessonIds = rows.map(r => r.les.id)
  const countMap: Record<string, number> = {}
  if (lessonIds.length > 0) {
    const countRows = await db
      .select({ lessonId: lessonStudents.lessonId, n: count() })
      .from(lessonStudents)
      .where(inArray(lessonStudents.lessonId, lessonIds))
      .groupBy(lessonStudents.lessonId)
    for (const r of countRows) countMap[r.lessonId] = Number(r.n)
  }

  return rows.map(r => ({
    ...r.les,
    aantalCursisten: countMap[r.les.id] ?? 0,
    instructeurNaam: r.instructeurNaam ?? null,
  }))
}
