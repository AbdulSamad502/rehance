import type { ExerciseDef } from '../types'

export const EXERCISES: ExerciseDef[] = [
  { id: 'ex-heel-slide', name: 'Heel slides', category: 'ROM', region: 'Knee', difficulty: 'Easy', equipment: 'None (mat or bed)', movementId: 'knee-flex', emoji: '🦵',
    instructions: 'Lie on your back. Slowly slide your heel toward your buttock, bending the knee as far as comfortable. Hold briefly, then slide back.', precautions: 'Stop if you feel sharp pain. Keep the movement slow.', sets: 3, reps: 10, holdSec: 3 },
  { id: 'ex-knee-ext-sit', name: 'Seated knee flexion / extension', category: 'ROM', region: 'Knee', difficulty: 'Easy', equipment: 'Chair', movementId: 'knee-flex', emoji: '🪑',
    instructions: 'Sit tall on a chair. Bend your knee back as far as you can, then straighten the leg fully.', precautions: 'Avoid forcing the end range.', sets: 3, reps: 12, holdSec: 2 },
  { id: 'ex-quad-set', name: 'Quad sets', category: 'Strength', region: 'Knee', difficulty: 'Easy', equipment: 'Towel roll', emoji: '💪',
    instructions: 'Sit with the leg straight and a small towel under the knee. Tighten the thigh muscle, pressing the knee down. Hold 5 seconds.', precautions: 'Do not hold your breath.', sets: 3, reps: 10, holdSec: 5 },
  { id: 'ex-slr', name: 'Straight leg raise', category: 'Strength', region: 'Hip / Knee', difficulty: 'Moderate', equipment: 'Mat', emoji: '🦿',
    instructions: 'Lie on your back, one knee bent. Tighten the thigh of the straight leg and lift it to the height of the other knee. Lower slowly.', precautions: 'Keep the back flat on the mat.', sets: 3, reps: 10, holdSec: 2 },
  { id: 'ex-mini-squat', name: 'Mini squats', category: 'Strength', region: 'Lower limb', difficulty: 'Moderate', equipment: 'Chair for support', movementId: 'squat', emoji: '🏋️',
    instructions: 'Hold a support. Bend both knees about a quarter of the way down as if sitting, keeping the heels on the floor. Stand back up.', precautions: 'Knees stay in line with the toes.', sets: 3, reps: 10, holdSec: 0 },
  { id: 'ex-sts', name: 'Sit-to-stand practice', category: 'Functional', region: 'Lower limb', difficulty: 'Moderate', equipment: 'Firm chair', movementId: 'sit-to-stand', emoji: '🪑',
    instructions: 'Sit at the front of a chair. Lean forward and stand up without using your hands if possible. Sit down slowly.', precautions: 'Use a wall nearby for safety.', sets: 3, reps: 8, holdSec: 0 },
  { id: 'ex-hip-march', name: 'Standing hip march', category: 'Mobility', region: 'Hip', difficulty: 'Easy', equipment: 'Chair for support', movementId: 'hip-flex', emoji: '🚶',
    instructions: 'Stand tall holding a support. Lift one knee toward your chest, lower, and repeat on the other side.', precautions: 'Do not lean back.', sets: 3, reps: 10, holdSec: 0 },
  { id: 'ex-sho-flex', name: 'Forward arm raise', category: 'ROM', region: 'Shoulder', difficulty: 'Easy', equipment: 'None', movementId: 'shoulder-flex', emoji: '🙋',
    instructions: 'Stand with arms by your sides. Raise one straight arm forward and up as high as is comfortable. Lower slowly.', precautions: 'Stay below the pain threshold.', sets: 3, reps: 10, holdSec: 2 },
  { id: 'ex-sho-abd', name: 'Sideways arm raise', category: 'ROM', region: 'Shoulder', difficulty: 'Moderate', equipment: 'None', movementId: 'shoulder-abd', emoji: '🙆',
    instructions: 'Facing forward, raise one straight arm out to the side and up. Lower slowly.', precautions: 'Avoid shrugging the shoulder.', sets: 3, reps: 10, holdSec: 2 },
  { id: 'ex-pendulum', name: 'Pendulum swings', category: 'Mobility', region: 'Shoulder', difficulty: 'Easy', equipment: 'Table for support', emoji: '🔔',
    instructions: 'Lean on a table with one hand. Let the other arm hang and swing gently in small circles.', precautions: 'Let gravity do the work.', sets: 2, reps: 20, holdSec: 0 },
  { id: 'ex-elbow-curl', name: 'Elbow bend and straighten', category: 'ROM', region: 'Elbow', difficulty: 'Easy', equipment: 'None', movementId: 'elbow-flex', emoji: '🦾',
    instructions: 'Bend the elbow to bring the hand toward the shoulder, then straighten fully.', precautions: 'Keep the upper arm still.', sets: 3, reps: 12, holdSec: 1 },
  { id: 'ex-slls', name: 'Single-leg stance', category: 'Balance', region: 'Balance', difficulty: 'Moderate', equipment: 'Wall or chair', movementId: 'single-leg', emoji: '⚖️',
    instructions: 'Stand near a wall. Lift one foot and balance as long as you can, up to 30 seconds.', precautions: 'Keep a hand near the support.', sets: 3, reps: 1, holdSec: 20 },
  { id: 'ex-bridge', name: 'Glute bridge', category: 'Strength', region: 'Lumbar / Hip', difficulty: 'Moderate', equipment: 'Mat', emoji: '🌉',
    instructions: 'Lie on your back with knees bent. Squeeze your buttocks and lift the hips until the body is in a straight line. Lower slowly.', precautions: 'Avoid arching the lower back.', sets: 3, reps: 12, holdSec: 3 },
  { id: 'ex-cat-camel', name: 'Cat-camel stretch', category: 'Mobility', region: 'Lumbar', difficulty: 'Easy', equipment: 'Mat', emoji: '🐈',
    instructions: 'On hands and knees, slowly arch your back up, then let it sag down. Move within a comfortable range.', precautions: 'Move slowly and breathe normally.', sets: 2, reps: 10, holdSec: 2 },
  { id: 'ex-neck-iso', name: 'Neck isometrics', category: 'Strength', region: 'Cervical', difficulty: 'Easy', equipment: 'None', emoji: '🧣',
    instructions: 'Press your palm against the side of your head and resist with the neck muscles for 5 seconds. Repeat in each direction.', precautions: 'No movement of the head, only muscle effort.', sets: 2, reps: 8, holdSec: 5 },
  { id: 'ex-ankle-abc', name: 'Ankle alphabet', category: 'ROM', region: 'Ankle', difficulty: 'Easy', equipment: 'None', emoji: '🔤',
    instructions: 'Sitting, trace the letters of the alphabet in the air with your big toe.', precautions: 'Slow, small movements.', sets: 2, reps: 1, holdSec: 0 },
  { id: 'ex-gait', name: 'Gait training walk', category: 'Gait', region: 'Gait', difficulty: 'Moderate', equipment: '4 m walkway', movementId: 'gait', emoji: '👣',
    instructions: 'Walk in a straight line at a comfortable pace, focusing on equal step length and heel-to-toe contact.', precautions: 'Use your walking aid if prescribed.', sets: 4, reps: 1, holdSec: 0 },
  { id: 'ex-calf', name: 'Calf raises', category: 'Strength', region: 'Ankle', difficulty: 'Moderate', equipment: 'Wall', emoji: '🦶',
    instructions: 'Standing with hands on a wall, rise onto your toes, hold, and lower slowly.', precautions: 'Keep the knees straight.', sets: 3, reps: 12, holdSec: 2 },
]

export const getExercise = (id: string) => EXERCISES.find((e) => e.id === id)

export interface OutcomeMeasure { id: string; name: string; area: string; max: number; unit: string; higherBetter: boolean; blurb: string }
export const OUTCOMES: OutcomeMeasure[] = [
  { id: 'KOOS', name: 'KOOS', area: 'Knee & Lower Limb', max: 100, unit: '/100', higherBetter: true, blurb: 'Knee injury and osteoarthritis outcome score' },
  { id: 'WOMAC', name: 'WOMAC', area: 'Knee & Lower Limb', max: 96, unit: '/96', higherBetter: false, blurb: 'Pain, stiffness and function in knee/hip OA' },
  { id: 'LEFS', name: 'LEFS', area: 'Knee & Lower Limb', max: 80, unit: '/80', higherBetter: true, blurb: 'Lower extremity functional scale' },
  { id: 'ODI', name: 'ODI', area: 'Spine', max: 100, unit: '%', higherBetter: false, blurb: 'Oswestry disability index (low back)' },
  { id: 'NDI', name: 'NDI', area: 'Spine', max: 100, unit: '%', higherBetter: false, blurb: 'Neck disability index' },
  { id: 'QuickDASH', name: 'DASH / QuickDASH', area: 'Shoulder & Upper Limb', max: 100, unit: '/100', higherBetter: false, blurb: 'Disabilities of the arm, shoulder and hand' },
  { id: 'SPADI', name: 'SPADI', area: 'Shoulder & Upper Limb', max: 100, unit: '/100', higherBetter: false, blurb: 'Shoulder pain and disability index' },
  { id: 'Berg', name: 'Berg Balance Scale', area: 'Balance', max: 56, unit: '/56', higherBetter: true, blurb: 'Balance across 14 tasks' },
  { id: 'TUG', name: 'Timed Up and Go', area: 'Mobility', max: 30, unit: 's', higherBetter: false, blurb: 'Seconds to stand, walk 3 m, turn, return, sit' },
  { id: '10MWT', name: '10-Meter Walk Test', area: 'Walking', max: 20, unit: 's', higherBetter: false, blurb: 'Seconds to walk 10 metres' },
  { id: '6MWT', name: '6-Minute Walk Test', area: 'Walking', max: 600, unit: 'm', higherBetter: true, blurb: 'Distance walked in six minutes' },
  { id: 'MAS', name: 'Modified Ashworth Scale', area: 'Neurological Rehabilitation', max: 4, unit: '/4', higherBetter: false, blurb: 'Muscle tone grading' },
]

export const TREATMENT_MODES = [
  'Therapeutic exercise', 'Manual therapy', 'Electrotherapy', 'Physical modalities', 'Neuromuscular training',
  'Gait training', 'Balance training', 'Functional training', 'Mobility training', 'Patient education', 'Home exercise programme',
]

export const CLINICAL_REPORTS = [
  'Initial assessment report', 'General physiotherapy assessment', 'Orthopaedic assessment report', 'Neurological assessment report',
  'Medical history summary', 'Treatment plan', 'Treatment session report', 'AI Motion Analysis report', 'Progress report',
  'Reassessment report', 'Outcome measure report', 'Clinical timeline', 'Discharge summary', 'Patient clinical summary',
]
export const ADMIN_REPORTS = [
  'Daily appointment report', 'Weekly appointment report', 'Monthly appointment report', 'Attendance report',
  'Patient registration report', 'Outstanding payment report', 'Revenue and collections report', 'Therapist workload report',
  'Session package report', 'Cancellation and no-show report', 'Clinic utilization report',
]

export const APPT_STATUSES = ['Scheduled', 'Confirmed', 'Checked in', 'In progress', 'Completed', 'Cancelled', 'Rescheduled', 'No-show'] as const
export const APPT_TYPES = ['Initial consultation', 'Follow-up session', 'Reassessment', 'Rehabilitation session', 'Discharge appointment'] as const

export const PERMISSIONS: { area: string; owner: string; receptionist: string; physio: string; patient: string }[] = [
  { area: 'Basic patient information', owner: 'Manage', receptionist: 'Manage permitted fields', physio: 'View relevant', patient: 'View and update permitted' },
  { area: 'Appointments', owner: 'Manage', receptionist: 'Manage', physio: 'View and manage own schedule', patient: 'View and request changes' },
  { area: 'Attendance', owner: 'Manage', receptionist: 'Manage', physio: 'View', patient: 'View own history' },
  { area: 'Billing records', owner: 'Manage', receptionist: 'Manage', physio: 'View relevant', patient: 'View own records' },
  { area: 'Medical history', owner: 'View', receptionist: 'Limited', physio: 'View and update', patient: 'View and submit updates' },
  { area: 'Clinical assessment', owner: 'View', receptionist: 'No routine access', physio: 'Create, edit, finalize', patient: 'View approved' },
  { area: 'AI Motion Analysis', owner: 'View', receptionist: 'No routine access', physio: 'Initiate, review, approve', patient: 'View approved feedback' },
  { area: 'Treatment plan', owner: 'View', receptionist: 'No clinical editing', physio: 'Create and modify', patient: 'View assigned plan' },
  { area: 'Treatment notes', owner: 'View', receptionist: 'No routine access', physio: 'Create and finalize', patient: 'View shared summaries' },
  { area: 'Exercise assignments', owner: 'View', receptionist: 'No clinical editing', physio: 'Create and modify', patient: 'View and complete' },
  { area: 'Clinical progress', owner: 'Overview', receptionist: 'Limited overview', physio: 'Full access', patient: 'View approved' },
  { area: 'Clinical reports', owner: 'View', receptionist: 'No routine access', physio: 'Create and manage', patient: 'Access approved' },
  { area: 'Patient feedback', owner: 'View', receptionist: 'Handle admin requests', physio: 'Review clinical feedback', patient: 'Submit own' },
  { area: 'Clinic operations', owner: 'Manage', receptionist: 'Manage', physio: 'Limited', patient: 'No access' },
  { area: 'Proprietary AI logic', owner: 'No access', receptionist: 'No access', physio: 'Use approved features', patient: 'No access' },
]
