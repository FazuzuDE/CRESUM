export default {
  'onboarding.workoutSaved':
    'Your workout was saved. Onboarding status could not be saved.',
  'onboarding.firstWorkout': 'Your first workout',
  'onboarding.firstWorkoutHelp':
    'Create a workout you can start and edit later. Planned values are not completed sets.',
  'onboarding.welcome': 'Welcome to CRESUM',
  'onboarding.intro': 'Train. Track. Grow. Your progress starts here.',
  'onboarding.nameQuestion': 'What should we call you?',
  'onboarding.name': 'Your name',
  'onboarding.continue': 'Continue',
  'onboarding.next': 'Next',
  'onboarding.goal': 'Training goal',
  'onboarding.goalHelp': 'What would you like to focus on?',
  'onboarding.muscle': 'Build muscle',
  'onboarding.strength': 'Get stronger',
  'onboarding.fitness': 'General fitness',
  'onboarding.manual': 'Set up workouts myself',
  'onboarding.experience': 'Training experience',
  'onboarding.experienceHelp': 'Choose the closest fit.',
  'onboarding.beginner': 'Beginner',
  'onboarding.some': 'Some experience',
  'onboarding.experienced': 'Experienced',
  'onboarding.body': 'Body details',
  'onboarding.bodyHelp':
    'Optional details for your profile. They do not determine a working weight.',
  'onboarding.optional': '{{label}} · optional',
  'onboarding.birth': 'Date of birth',
  'onboarding.chooseDate': 'Choose date',
  'onboarding.height': 'Height (cm)',
  'onboarding.weight': 'Body weight (kg)',
  'onboarding.notProvided': 'Not provided',
  'onboarding.skipBody': 'Continue without body details',
  'onboarding.ready': 'You’re ready to start',
  'onboarding.review': 'Review your program',
  'onboarding.summary': {
    one: '{{count, number}} strength workout per week · Gym · starts {{date}}',
    other:
      '{{count, number}} strength workouts per week · Gym · starts {{date}}',
  },
  'onboarding.attribution':
    'CRESUM adaptation of published training programs from ACSM, NSCA, ACE, HSS and NHS guidance. Working weights are chosen manually; planned values do not count as completed sets.',
  'onboarding.hideProgram': 'Hide full program',
  'onboarding.viewProgram': 'View full program',
  'onboarding.week': 'Week {{index, number}}: {{schedule}}',
  'onboarding.slot': '{{key}} · {{date}}',
  'onboarding.day': '{{key}} · {{name}}',
  'onboarding.movement':
    '{{name}} · {{sets, number}} × {{min, number}}–{{max, number}} · rest {{restMin, number}}–{{restMax, number}}s',
  'onboarding.movementPerSide':
    '{{name}} · {{sets, number}} × {{min, number}}–{{max, number}} per side · rest {{restMin, number}}–{{restMax, number}}s',
  'onboarding.warmup':
    'Warm up separately. Use a manageable load with 2–3 reps in reserve. Progress manually when the upper rep target feels controlled; no automatic load increases.',
  'onboarding.cardio':
    'Walking or cycling: gradual target of 150 moderate minutes per week; start with manageable 10–15 minute sessions. Cardio guidance is separate from strength logging.',
  'onboarding.hideSchedule': 'Hide schedule options',
  'onboarding.schedule': 'Schedule options',
  'onboarding.startDateValue': 'Start date · {{date}}',
  'onboarding.startDate': 'Start date',
  'onboarding.frequency': 'Workouts per week',
  'onboarding.workouts': {
    one: '{{count, number}} workout',
    other: '{{count, number}} workouts',
  },
  'onboarding.frequencyHelp':
    'Only the recommended frequency has a checked variant for this goal and experience. Other frequencies use manual setup.',
  'onboarding.sessionDay':
    'Session {{index, number}} · day of the plan week (1–7)',
  'onboarding.sessionDayLabel': 'Session {{index, number}} day of plan week',
  'onboarding.reduced': 'First session: 1 set per exercise',
  'onboarding.reduce': 'New to training? Reduce first session to 1 set',
  'onboarding.retryStart': 'Retry START!',
  'onboarding.saving': 'Saving program…',
  'onboarding.start': 'START!',
  'onboarding.openSaved': 'Open saved workouts',
  'onboarding.back': 'Back',
  'onboarding.backProfile': 'Back to Profile',
  'onboarding.missing': 'Required exercises unavailable: {{exercises}}',
  'onboarding.retry': 'Retry onboarding',
  'onboarding.bypass': 'Continue to app',
  'onboarding.loading': 'Loading your workouts…',
  'onboarding.savedUnavailable': 'Saved workouts are unavailable. Retry above.',
  'program.day.F': 'Full Body',
  'program.day.U': 'Upper Body',
  'program.day.L': 'Lower Body',
  'program.day.A': 'Strength A',
  'program.day.B': 'Strength B',
  'program.day.C': 'Strength C',
  'program.day.D': 'Strength D',
  'program.day.E': 'Strength E',
  'program.day.G': 'Fitness G',
  'program.day.H': 'Fitness H',
  'error.nameRequired': 'Enter your name to continue.',
  'error.birthDate': 'Enter a valid date of birth, or leave it empty.',
  'error.height': 'Enter a valid height, or leave it empty.',
  'error.bodyWeight': 'Enter a valid body weight, or leave it empty.',
  'error.age': 'Enter a valid age, or leave it empty.',
  'error.under18':
    'Adult starter programs are unavailable for under-18s. You can set up workouts manually.',
  'error.programFrequency':
    'No checked program for this frequency. Keep the recommended frequency or use manual setup.',
  'error.programMissing':
    'Required exercises are unavailable. Review the program or use manual setup.',
  'error.programSelection':
    'Choose a goal and experience to prepare your program.',
  'error.programProposal':
    'Program proposal is unavailable. Review all required exercises and dates.',
  'error.programSchedule':
    'Choose one date for every planned session. Alternative frequencies require a checked program.',
  'error.programRest': 'Keep at least one rest day between full-body sessions.',
  'error.programSplitRest':
    'Keep recovery between repeated upper/lower sessions.',
  'error.programSave': 'Could not save program. Retry; your workouts are safe.',
  'error.onboardingLoad':
    'Saved onboarding is unavailable. Retry or continue to the app; your workouts are safe.',
  'error.onboardingSave':
    'Onboarding progress could not be saved. Retry before closing the app.',
} as const;
