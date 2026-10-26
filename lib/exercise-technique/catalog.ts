import type { ExerciseId } from '../exercise-library';
import type { ExerciseTechnique } from './types';
export const techniqueCatalog = {
  'barbell-bench-press': {
    revision: 1,
    scope: 'Flat bench; barbell.',
    setup: [
      'Set rack and safeties; use a spotter for demanding loads. Lie with feet supported and bar above your eyes.',
    ],
    movement: [
      'Use a closed grip slightly wider than shoulders. Lower toward mid-chest under control; press up.',
    ],
    checks: [
      'Keep wrists over forearms and shoulders and hips supported. Exhale on the press.',
    ],
    mistakes: [
      'Bouncing the bar: lower gently.',
      'Lifting hips: keep bench contact.',
      'Bent wrists: align the forearms.',
    ],
    sources: ['ace-5'],
  },
  'incline-dumbbell-press': {
    revision: 1,
    scope: 'Incline bench; two dumbbells.',
    setup: [
      'Set a stable incline and support both feet; bring dumbbells beside the upper chest.',
    ],
    movement: [
      'Press both weights upward together, then lower slowly to a comfortable depth.',
    ],
    checks: [
      'Keep wrists above elbows and head, shoulders and hips on the bench.',
    ],
    mistakes: [
      'Overarching: brace the trunk.',
      'Uneven lowering: move together.',
      'Forced depth: shorten the range.',
    ],
    sources: ['ace-25'],
  },
  'dumbbell-bench-press': {
    revision: 1,
    scope: 'Flat bench; two dumbbells.',
    setup: [
      'Lie with feet supported; hold dumbbells beside the chest with a secure closed grip.',
    ],
    movement: [
      'Press upward in unison; lower under control with forearms supporting the weights.',
    ],
    checks: [
      'Keep wrists aligned and shoulders supported. Breathe out while pressing.',
    ],
    mistakes: [
      'Clashing weights: stop them apart.',
      'Dropping weights: control the descent.',
      'Lifting hips: maintain contact.',
    ],
    sources: ['ace-19'],
  },
  'machine-chest-press': {
    revision: 1,
    scope: 'Seated machine press; handle geometry varies.',
    setup: [
      'Adjust seat so handles are around mid-chest. Keep back supported and feet stable.',
    ],
    movement: [
      'Press forward smoothly; return without letting the stack crash.',
    ],
    checks: [
      'Use a closed grip, aligned wrists and a controlled comfortable range.',
    ],
    mistakes: [
      'Seat too low: reset height.',
      'Shoulders leaving pad: reduce reach.',
      'Forceful elbow lockout: finish gently.',
    ],
    sources: ['ace-188'],
  },
  'cable-chest-fly': {
    revision: 1,
    scope: 'Standing cable fly; pulley angle depends on the selected setup.',
    setup: [
      'Stand between matched pulleys in a stable stance; hold both handles with softly bent elbows.',
    ],
    movement: [
      'Bring arms forward in an arc until hands approach each other; return slowly.',
    ],
    checks: [
      'Maintain the elbow bend and a steady torso; avoid forcing the arms behind you.',
    ],
    mistakes: [
      'Turning it into a press: hold elbow angle.',
      'Swinging: reduce load.',
      'Excessive crossover: finish without hand collision.',
    ],
    sources: ['ace-chest'],
    adaptation:
      'Cable-fly summary of the source crossover; crossing past the midline is not required.',
  },
  'pec-deck-fly': {
    revision: 1,
    scope: 'Seated pec deck; handle and forearm-pad versions differ.',
    setup: [
      'Adjust seat to align the machine arms comfortably with your chest/shoulders; support back and feet.',
    ],
    movement: [
      'Bring the pads or handles inward smoothly, then reverse under control.',
    ],
    checks: ['Follow the machine placard; avoid a forced shoulder stretch.'],
    mistakes: [
      'Leaving the backrest: keep support.',
      'Shrugging: lower load.',
      'Jerking the stack: slow the return.',
    ],
    sources: ['ace-chest'],
    adaptation:
      'Source shows a forearm-pad model; handle-based machines require their own setup.',
  },
  'push-up': {
    revision: 1,
    scope: 'Floor push-up.',
    setup: [
      'Place hands around shoulder width, extend legs and brace the body in a straight line.',
    ],
    movement: [
      'Lower chest toward the floor as one unit; press the floor away to rise.',
    ],
    checks: [
      'Keep head aligned, hips level and a comfortable elbow path. Breathe normally.',
    ],
    mistakes: [
      'Sagging hips: brace glutes and abdomen.',
      'Leading with chin: move chest first.',
      'Partial uncontrolled reps: reduce difficulty.',
    ],
    sources: ['ace-41'],
  },
  'barbell-bent-over-row': {
    revision: 1,
    scope: 'Two-arm barbell row; grip remains unspecified.',
    setup: [
      'Hold the bar with a secure comfortable grip; hinge at the hips with soft knees and a steady back.',
    ],
    movement: [
      'Pull toward the abdomen, guiding elbows backward; lower until arms extend.',
    ],
    checks: ['Keep the torso angle steady and the bar close.'],
    mistakes: [
      'Standing up each rep: reduce load.',
      'Rounding the back: reset the hinge.',
      'Jerking the bar: pull smoothly.',
    ],
    sources: ['ace-12'],
    adaptation:
      'The source shows an overhand-grip example; this generic catalog ID does not prescribe one grip.',
  },
  'seated-cable-row': {
    revision: 1,
    scope: 'Seated cable row; attachment remains unspecified.',
    setup: [
      'Support feet, soften knees and sit tall; grasp the selected handle without rounding the back.',
    ],
    movement: [
      'Pull toward the trunk with elbows moving backward, then extend arms slowly.',
    ],
    checks: [
      'Keep torso steady and wrists aligned; avoid exaggerating the lean.',
    ],
    mistakes: [
      'Rocking back: stay steady.',
      'Rounding at the start: sit tall.',
      'Crashing stack: control return.',
    ],
    sources: ['ace-48'],
    adaptation:
      'The source uses a narrow handle; this generic catalog ID does not prescribe one grip.',
  },
  'one-arm-dumbbell-row': {
    revision: 1,
    scope: 'Bench-supported single-arm row.',
    setup: [
      'Support one hand and knee on a stable bench; brace your back and hold the dumbbell beneath the other shoulder.',
    ],
    movement: [
      'Draw the elbow toward the hip; lower the dumbbell without rotating the torso.',
    ],
    checks: [
      'Keep head aligned and support points steady. Repeat on the other side.',
    ],
    mistakes: [
      'Twisting to lift: lower load.',
      'Shrugging: guide the elbow.',
      'Dropping the shoulder: maintain control.',
    ],
    sources: ['ace-126'],
  },
  'chest-supported-dumbbell-row': {
    revision: 1,
    scope: 'Two-arm incline-bench row.',
    setup: [
      'Lie chest-down on a stable incline bench; support feet and let dumbbells hang.',
    ],
    movement: [
      'Pull elbows backward; lower weights while keeping the chest supported.',
    ],
    checks: ['Use a comfortable elbow path and keep head aligned.'],
    mistakes: [
      'Lifting chest: maintain pad contact.',
      'Shrugging: reduce load.',
      'Jerking: pull and return slowly.',
    ],
    sources: ['ace-shoulders'],
    adaptation:
      'Adapted from ACE incline-row guidance; elbow path is not fixed to its high-row example.',
  },
  'lat-pulldown': {
    revision: 1,
    scope: 'Generic pulldown; grip and attachment unspecified.',
    setup: ['Set thigh support and feet; use a comfortable secure grip.'],
    movement: [
      'Pull in front of the body; return slowly with natural shoulder-blade movement.',
    ],
    checks: ['Keep torso steady; choose comfortable range.'],
    mistakes: [
      'Behind-neck pulling: stay in front.',
      'Swinging: reduce load.',
      'Forced chest contact: stop comfortably.',
    ],
    sources: ['ace-158'],
  },
  'lat-pulldown-wide-pronated-bar': {
    revision: 1,
    scope: 'Wide bar; pronated grip.',
    setup: [
      'Secure thighs and feet; hold the bar overhand, wider than shoulders.',
    ],
    movement: [
      'Guide elbows down as the bar approaches the upper chest; extend arms slowly.',
    ],
    checks: ['Keep a modest stable lean; chest contact is optional.'],
    mistakes: [
      'Excessive width: choose a comfortable grip.',
      'Torso swing: reduce load.',
      'Behind-neck pull: stay in front.',
    ],
    sources: ['nsca-pulldown'],
    adaptation:
      "Wide-bar checklist summarized with CRESUM's approved comfortable-range boundary.",
  },
  'lat-pulldown-close-neutral-v-handle': {
    revision: 1,
    scope: 'Close neutral grip; V-handle.',
    setup: [
      'Secure thigh pad and feet; grip both sides of the V-handle, palms facing each other.',
    ],
    movement: ['Pull toward upper chest; return slowly.'],
    checks: [
      'Keep wrists aligned and torso steady; allow natural scapular movement.',
    ],
    mistakes: [
      'Swinging: reduce load.',
      'Forcing chest contact: stop comfortably.',
      'Overpulling elbows: shorten range.',
    ],
    sources: ['ace-158'],
    adaptation:
      'Shared pulldown mechanics adapted to the approved CRESUM V-handle variant.',
  },
  'lat-pulldown-close-neutral-ergonomic-handle': {
    revision: 1,
    scope:
      'Seated front pulldown; compact ergonomic handle; close neutral grip.',
    setup: [
      'Secure thighs and support feet. Face the high pulley; rest palms on the handle supports and wrap fingers around the rounded edges, palms facing each other.',
    ],
    movement: [
      'Draw elbows down toward your sides, bringing the handle toward the upper chest; return under control to comfortable overhead extension.',
    ],
    checks: [
      'Keep wrists aligned, pelvis stable and a modest constant lean. Allow natural shoulder-blade movement; chest contact is optional.',
    ],
    mistakes: [
      'Pulling with a body swing: lower the load.',
      'Reversing the hand contact or forcing bent wrists: reset the grip.',
      'Driving elbows far behind the trunk: stop the pull earlier.',
    ],
    sources: ['ace-158'],
    adaptation:
      'Shared pulldown mechanics adapted to the selected compact ergonomic attachment. Qualitative muscle roles do not measure activation or prove a benefit over other widths.',
  },
  'lat-pulldown-reverse-grip': {
    revision: 1,
    scope: 'Supinated grip; attachment and width unspecified.',
    setup: ['Secure thighs and feet; choose comfortable palm-up hand spacing.'],
    movement: ['Draw elbows down in front; return under control.'],
    checks: ['Keep wrists comfortable and torso steady.'],
    mistakes: [
      'Forced grip: adjust spacing.',
      'Swinging: reduce load.',
      'Behind-neck pull: stay in front.',
    ],
    sources: ['ace-158', 'grip-variants'],
    adaptation:
      'Grip variant supported by the ACSM author abstract; shared execution adapted from ACE, not a separately validated protocol.',
  },
  'pull-up': {
    revision: 1,
    scope: 'Bodyweight pull-up; overhand grip.',
    setup: [
      'Use a secure bar and closed grip; brace the trunk in a controlled hang.',
    ],
    movement: [
      'Guide elbows down to lift the body; lower smoothly to the start.',
    ],
    checks: [
      'Keep head aligned and avoid kicking; use a comfortable shoulder range.',
    ],
    mistakes: [
      'Swinging: reset the hang.',
      'Reaching with chin: lift the body.',
      'Dropping down: control descent.',
    ],
    sources: ['ace-191'],
  },
  'assisted-pull-up': {
    revision: 1,
    scope: 'Counterweighted pull-up; machine support differs.',
    setup: [
      'Select assistance and mount using the machine steps; grip handles and settle on its support.',
    ],
    movement: [
      'Pull upward, then lower smoothly. Return support to rest before dismounting.',
    ],
    checks: [
      'More selected counterweight means more assistance. Follow the machine placard.',
    ],
    mistakes: [
      'Jumping off support: use steps.',
      'Swinging: lower speed.',
      'Too little assistance: increase support.',
    ],
    sources: ['lf-assist'],
    adaptation:
      'Manufacturer example uses a knee pad; other support designs need their own mounting instructions.',
  },
  'machine-high-row': {
    revision: 1,
    scope: 'Seated high-row machine; handle path varies.',
    setup: [
      'Adjust seat and chest pad for comfortable reach; support feet and brace the trunk.',
    ],
    movement: ['Pull handles toward the upper trunk; return with control.'],
    checks: [
      'Keep chest supported and wrists aligned; follow the machine path.',
    ],
    mistakes: [
      'Lifting off pad: reduce load.',
      'Yanking handles: slow down.',
      'Forced elbow travel: stop comfortably.',
    ],
    sources: ['ace-169'],
    adaptation:
      "ACE's horizontal high-row setup informs this generic entry; angled-lever machines differ.",
  },
  'cable-straight-arm-pulldown': {
    revision: 1,
    scope: 'Standing shoulder-extension pulldown.',
    setup: [
      'Set a high pulley and secure the attachment; stand tall with soft knees and arms reaching forward/up.',
    ],
    movement: [
      'Sweep arms toward the thighs, then return without changing elbow bend substantially.',
    ],
    checks: ['Keep ribs stacked and torso steady; move through the shoulders.'],
    mistakes: [
      'Bending elbows into pushdown: keep arm length.',
      'Back arching: brace.',
      'Swinging: use a manageable load.',
    ],
    sources: ['ace-334'],
    adaptation:
      'Attachment remains unspecified; the source mentions both bar and rope.',
  },
  'barbell-deadlift': {
    revision: 1,
    scope: 'Conventional barbell deadlift.',
    setup: [
      'Place feet under the bar, hinge and bend knees to grip it; brace with the back steady.',
    ],
    movement: [
      'Push the floor away and stand with the bar close; hinge and bend knees to return.',
    ],
    checks: ['Keep arms long; finish upright rather than leaning back.'],
    mistakes: [
      'Jerking from floor: take up slack.',
      'Bar drifting away: keep close.',
      'Overextension: stand tall.',
    ],
    sources: ['ace-6'],
    adaptation:
      'A secure double-overhand grip is a conservative starting option; the source also depicts mixed grip.',
  },
  'dumbbell-shoulder-press': {
    revision: 1,
    scope: 'Dumbbell overhead press.',
    setup: [
      'Stand stably with soft knees or sit on a supported bench; bring dumbbells beside shoulders.',
    ],
    movement: ['Press overhead, then lower smoothly to the start.'],
    checks: [
      'Keep trunk braced and wrists aligned; let shoulders move naturally overhead.',
    ],
    mistakes: [
      'Low-back arch: keep ribs controlled.',
      'Leg drive: use the intended strict press.',
      'Uneven path: reduce load.',
    ],
    sources: ['ace-shoulders'],
    adaptation:
      'The cited example is standing; supported seating is a stability adaptation.',
  },
  'barbell-overhead-press': {
    revision: 1,
    scope: 'Standing strict barbell overhead press.',
    setup: [
      'Unrack at shoulder height with a secure grip and forearms supporting the bar; brace the trunk.',
    ],
    movement: [
      'Press overhead with clearance for the face; lower carefully to the shoulders.',
    ],
    checks: ['Maintain stable feet and ribs; no deliberate leg drive.'],
    mistakes: [
      'Excessive backbend: brace.',
      'Striking chin: control bar clearance.',
      'Bouncing from shoulders: pause and reset.',
    ],
    sources: ['ace-71', 'novus-band'],
  },
  'machine-shoulder-press': {
    revision: 1,
    scope: 'Supported overhead machine press; grip unspecified.',
    setup: [
      'Adjust seat so handles are around shoulder height; support feet and back.',
    ],
    movement: [
      "Press upward through the machine's comfortable path; lower smoothly.",
    ],
    checks: ['Keep wrists aligned and avoid excessive lumbar arch.'],
    mistakes: [
      'Wrong seat height: adjust.',
      'Leaving backrest: reduce load.',
      'Slamming the return: control it.',
    ],
    sources: ['ace-187'],
    adaptation:
      "ACE demonstrates close handles; CRESUM's generic ID does not require that grip.",
  },
  'dumbbell-lateral-raise': {
    revision: 1,
    scope: 'Standing dumbbell lateral raise.',
    setup: [
      'Stand stably with dumbbells beside thighs, elbows soft and wrists aligned.',
    ],
    movement: [
      'Raise upper arms sideways toward shoulder level; lower slowly.',
    ],
    checks: ['Keep the torso steady; avoid forcing a thumbs-down position.'],
    mistakes: [
      'Swinging: reduce load.',
      'Shrugging: keep neck relaxed.',
      'Excessive height: stop in comfortable range.',
    ],
    sources: ['ace-26'],
  },
  'cable-lateral-raise': {
    revision: 1,
    scope: 'Single-arm cable lateral raise.',
    setup: [
      'Stand side-on to a cable and hold the opposite handle; use a stable stance.',
    ],
    movement: [
      'Lift the arm sideways toward shoulder height, then lower smoothly; change sides.',
    ],
    checks: ['Keep torso steady and a small elbow bend.'],
    mistakes: [
      'Leaning to lift: lower load.',
      'Shrugging: guide the upper arm.',
      'Crossing cable unsafely: check clearance.',
    ],
    sources: ['ace-354'],
    adaptation:
      'Source uses waist-height pulley; lower-pulley arrangements need cable clearance and comfortable setup.',
  },
  'reverse-pec-deck': {
    revision: 1,
    scope: 'Chest-supported reverse-fly machine.',
    setup: [
      'Face the pad, adjust seat for comfortable handle height and support the chest.',
    ],
    movement: ['Spread arms along the machine path; return without bouncing.'],
    checks: ['Keep a soft elbow angle and avoid pushing the head forward.'],
    mistakes: [
      'Chest lifting: stay supported.',
      'Shrugging: reduce load.',
      'Overpulling: stop comfortably.',
    ],
    sources: ['ace-353'],
    adaptation:
      'CRESUM machine adaptation of ACE reverse-fly mechanics; exact machine placard governs setup.',
  },
  'resistance-band-pull-apart': {
    revision: 1,
    scope: 'Standing horizontal band pull-apart.',
    setup: [
      'Hold a sound band in front at chest height with arms long and light initial tension.',
    ],
    movement: ['Open arms sideways, then return slowly.'],
    checks: ['Keep chin neutral and trunk steady.'],
    mistakes: [
      'Jerking band: slow down.',
      'Shrugging: relax neck.',
      'Arching back: brace the trunk.',
    ],
    sources: ['novus-band'],
    adaptation:
      'Source is a physiotherapy exercise example, not an individualized rehabilitation prescription.',
  },
  'dumbbell-biceps-curl': {
    revision: 1,
    scope: 'Dumbbell elbow-flexion curl.',
    setup: [
      'Stand stably or sit supported; hold dumbbells with palms forward and arms by your sides.',
    ],
    movement: ['Bend elbows to raise weights; lower slowly.'],
    checks: ['Keep wrists aligned and trunk steady.'],
    mistakes: [
      'Swinging: lower load.',
      'Elbows travelling forward: keep them steady.',
      'Bent wrists: align forearms.',
    ],
    sources: ['ace-44'],
    adaptation:
      "ACE's seated example is adapted to the catalog's unspecified standing/seated configuration.",
  },
  'barbell-curl': {
    revision: 1,
    scope: 'Straight-bar standing curl.',
    setup: [
      'Stand with a secure palm-up grip around shoulder width; brace torso.',
    ],
    movement: ['Curl bar toward shoulders, then lower slowly.'],
    checks: ['Keep elbows near the body and wrists comfortable.'],
    mistakes: [
      'Leaning back: reduce load.',
      'Throwing elbows forward: keep steady.',
      'Dropping bar: control descent.',
    ],
    sources: ['ace-70'],
  },
  'ez-bar-curl': {
    revision: 1,
    scope: 'Standing angled EZ-bar curl.',
    setup: [
      'Use the angled sections for a comfortable semi-supinated grip; stand with knees soft.',
    ],
    movement: ['Curl through the elbows; lower with control.'],
    checks: ['Keep upper arms steady and wrists aligned.'],
    mistakes: [
      'Swinging: reduce load.',
      'Forced wrist angle: choose comfortable sections.',
      'Short uncontrolled return: slow down.',
    ],
    sources: ['nasm-curl'],
    adaptation:
      'Adaptation of barbell-curl mechanics to an EZ bar; no universal exact hand spacing prescribed.',
  },
  'hammer-curl': {
    revision: 1,
    scope: 'Neutral-grip dumbbell curl.',
    setup: [
      'Stand stably with palms facing inward and elbows beside the trunk.',
    ],
    movement: [
      'Curl one or both dumbbells; lower while retaining the neutral grip.',
    ],
    checks: ['Keep wrists aligned and shoulders quiet.'],
    mistakes: [
      'Turning palms up: keep neutral grip.',
      'Torso swing: lower load.',
      'Shrugging: relax the shoulders.',
    ],
    sources: ['ace-10'],
  },
  'cable-biceps-curl': {
    revision: 1,
    scope: 'Standing low-cable curl; attachment unspecified.',
    setup: [
      'Set a low pulley, secure the attachment and stand in a stable position.',
    ],
    movement: ['Curl with elbows beside the torso; return slowly.'],
    checks: ['Keep wrists comfortable and resist the cable without leaning.'],
    mistakes: [
      'Hip thrust: reduce load.',
      'Elbows swinging: keep steady.',
      'Stack collision: slow the return.',
    ],
    sources: ['ace-322'],
    adaptation:
      "ACE's resistance-band curl is adapted to a low cable, preserving elbow-flexion mechanics.",
  },
  'cable-triceps-pushdown': {
    revision: 1,
    scope: 'High-cable elbow extension; attachment unspecified.',
    setup: [
      'Stand tall by a high pulley; hold attachment and bring elbows beside the ribs.',
    ],
    movement: [
      'Extend elbows downward; return without moving upper arms substantially.',
    ],
    checks: ['Use a secure grip, soft knees and stable trunk.'],
    mistakes: [
      'Shoulder swing: keep upper arms still.',
      'Back arching: brace.',
      'Stack crashing: return slowly.',
    ],
    sources: ['ace-3'],
    adaptation:
      'Source depicts rope; the generic catalog ID does not mandate that attachment.',
  },
  'overhead-cable-triceps-extension': {
    revision: 1,
    scope: 'Overhead cable elbow extension; pulley setup varies.',
    setup: [
      'Choose a stable stance facing away from the pulley; hold the attachment overhead with cable clear of the head.',
    ],
    movement: [
      'Bend elbows comfortably, then extend without moving the upper arms excessively.',
    ],
    checks: ['Keep ribs controlled and head clear of the attachment.'],
    mistakes: [
      'Arching back: reduce load.',
      'Elbows flaring abruptly: keep comfortable alignment.',
      'Cable hitting head: reset setup.',
    ],
    sources: ['ace-74'],
    adaptation:
      'Overhead dumbbell mechanics adapted to cable resistance; pulley height follows the actual station.',
  },
  'dumbbell-overhead-triceps-extension': {
    revision: 1,
    scope: 'Two-hand overhead dumbbell extension.',
    setup: [
      'Stand stably, brace and support one dumbbell securely with both hands overhead.',
    ],
    movement: ['Bend elbows to lower behind the head; extend smoothly.'],
    checks: ['Keep upper arms relatively steady and clear of the head.'],
    mistakes: [
      'Excessive backbend: brace.',
      'Moving shoulders to lift: reduce load.',
      'Hitting head: shorten range.',
    ],
    sources: ['ace-74'],
  },
  'close-grip-bench-press': {
    revision: 1,
    scope: 'Shoulder-width barbell bench press.',
    setup: [
      'Lie on a supported bench with feet planted; use a closed grip about shoulder width and safeties/spotter.',
    ],
    movement: ['Lower toward chest with elbows near ribs; press upward.'],
    checks: ['Keep wrists above forearms and hips supported.'],
    mistakes: [
      'Hands too narrow: use comfortable spacing.',
      'Bouncing: control the bar.',
      'Lifting hips: maintain contact.',
    ],
    sources: ['ace-311'],
  },
  'assisted-dip-machine': {
    revision: 1,
    scope: 'Counterweighted dip machine.',
    setup: [
      'Select assistance; use steps to grip handles and settle on the support.',
    ],
    movement: [
      'Lower through a comfortable range; press until elbows are nearly straight. Return support to rest before dismounting.',
    ],
    checks: [
      'Stay upright and controlled; more counterweight gives more assistance.',
    ],
    mistakes: [
      'Excessive depth: shorten range.',
      'Shrugging or bouncing: reduce difficulty.',
      'Jumping off pad: use steps.',
    ],
    sources: ['lf-assist'],
    adaptation:
      'Manufacturer knee-pad example; other support designs require their own placard.',
  },
  'barbell-back-squat': {
    revision: 1,
    scope: 'Barbell squat; bar position remains individually comfortable.',
    setup: [
      'Set rack/safeties; rest bar on the upper-back shelf, not the neck. Unrack into a stable stance.',
    ],
    movement: [
      'Bend hips and knees to a controlled depth; stand by pressing through supported feet.',
    ],
    checks: ['Keep knees tracking with feet and trunk braced.'],
    mistakes: [
      'Heels lifting: adjust stance/depth.',
      'Knees collapsing: reduce load.',
      'Back rounding: limit depth.',
    ],
    sources: ['ace-11'],
    adaptation:
      'Comfortable controlled depth replaces a universal below-parallel requirement.',
  },
  'barbell-front-squat': {
    revision: 1,
    scope: 'Front-rack barbell squat.',
    setup: [
      'Set safeties and rest bar on front shoulders with elbows lifted; stand in a stable stance.',
    ],
    movement: [
      'Bend hips and knees while keeping the torso upright; stand smoothly.',
    ],
    checks: ['Maintain the rack position and supported feet.'],
    mistakes: [
      'Elbows dropping: reset rack.',
      'Bar held only in wrists: support on shoulders.',
      'Forced depth: shorten range.',
    ],
    sources: ['nsca-front'],
  },
  'leg-press': {
    revision: 1,
    scope: 'Leg press; seated or inclined machine geometry differs.',
    setup: [
      'Adjust the machine with back/pelvis supported and feet planted on the plate; set safety stops where available.',
    ],
    movement: [
      'Extend legs without forceful lockout; bend hips/knees to return under control.',
    ],
    checks: [
      'Keep heels and pelvis supported; avoid thighs compressing the trunk.',
    ],
    mistakes: [
      'Pelvis lifting: shorten depth.',
      'Knee lockout: finish softly.',
      'Bouncing: control return.',
    ],
    sources: ['ace-154'],
    adaptation:
      'Source is a seated model; inclined sled mounting/safeties follow its placard.',
  },
  'smith-machine-squat': {
    revision: 1,
    scope: 'Guided-bar squat; rail angle and setup vary.',
    setup: [
      'Set safety stops; place bar on the upper-back shelf and find a stable stance suited to the rail path.',
    ],
    movement: [
      'Unlock deliberately; squat within a controlled range, then stand and rerack securely.',
    ],
    checks: [
      'Keep supported feet and braced trunk; do not force an uncomfortable fixed path.',
    ],
    mistakes: [
      'Missing safeties: set them.',
      'Forced stance: adjust setup.',
      'Unsecured rerack: verify hooks.',
    ],
    sources: ['ace-11', 'lf-smith'],
    adaptation:
      "Free-squat mechanics adapted to a guided bar; follow the particular manufacturer's instructions.",
  },
  'goblet-squat': {
    revision: 1,
    scope: 'Front-held dumbbell squat.',
    setup: ['Hold one dumbbell securely at the chest; set a stable stance.'],
    movement: ['Bend hips and knees; stand with the trunk controlled.'],
    checks: [
      'Keep elbows close, feet supported and knees tracking comfortably.',
    ],
    mistakes: [
      'Weight drifting away: keep close.',
      'Heels lifting: adjust depth.',
      'Rounding: reduce range.',
    ],
    sources: ['ace-362'],
    adaptation:
      "Controlled comfortable depth takes priority over the source's below-knee example.",
  },
  'dumbbell-reverse-lunge': {
    revision: 1,
    scope: 'Dumbbells at sides; backward step.',
    setup: ['Stand stably holding dumbbells beside thighs.'],
    movement: [
      'Step back, lower under control, then return; repeat both sides.',
    ],
    checks: ['Keep feet separated for balance and trunk steady.'],
    mistakes: [
      'Narrow tightrope stance: widen spacing.',
      'Dropping down: control the step.',
      'Knee collapse: reduce range.',
    ],
    sources: ['hss-posterior'],
  },
  'bulgarian-split-squat': {
    revision: 1,
    scope: 'Rear-foot-elevated dumbbell split squat.',
    setup: [
      'Choose a stable bench/platform and balanced split stance; hold dumbbells securely.',
    ],
    movement: [
      'Lower hips by bending the legs; rise smoothly. Repeat on both sides.',
    ],
    checks: ['Keep lead foot supported and trunk steady.'],
    mistakes: [
      'Bench too high: use comfortable support.',
      'Bouncing rear leg: slow down.',
      'Knee collapse: adjust stance/load.',
    ],
    sources: ['ace-366'],
    adaptation:
      'ACE shows a front-held dumbbell; the catalog permits side-held dumbbells without changing the exercise identity.',
  },
  'leg-extension': {
    revision: 1,
    scope: 'Seated knee-extension machine.',
    setup: [
      'Align knees with machine pivot, support back and set shin pad above the ankles.',
    ],
    movement: ['Extend knees smoothly toward straight; lower under control.'],
    checks: [
      'Stay supported and use comfortable range without forceful lockout.',
    ],
    mistakes: [
      'Pivot mismatch: reset seat.',
      'Kicking pad: reduce load.',
      'Partial jerky return: move smoothly.',
    ],
    sources: ['mayo-leg-extension'],
  },
  'lying-leg-curl': {
    revision: 1,
    scope: 'Prone knee-flexion machine.',
    setup: [
      'Align knees with pivot; set lower-leg pad clear of heels and hold support handles.',
    ],
    movement: ['Bend knees to raise pad; lower slowly.'],
    checks: ['Keep pelvis supported and avoid lumbar movement.'],
    mistakes: [
      'Hips lifting: reduce load.',
      'Back arching: brace.',
      'Pad on heel: adjust position.',
    ],
    sources: ['ace-153'],
  },
  'seated-leg-curl': {
    revision: 1,
    scope: 'Seated knee-flexion machine.',
    setup: [
      'Support back, align knees with pivot and secure thigh support; place lower legs on the roller.',
    ],
    movement: [
      'Curl heels down/back, then extend knees slowly toward the start.',
    ],
    checks: ['Keep trunk and thighs supported; move smoothly.'],
    mistakes: [
      'Jerking: reduce load.',
      'Rising out of seat: secure support.',
      'Forceful straightening: finish gently.',
    ],
    sources: ['mayo-leg-curl'],
  },
  'barbell-romanian-deadlift': {
    revision: 1,
    scope: 'Top-down barbell hip hinge.',
    setup: ['Stand with bar near thighs, knees softly bent and trunk braced.'],
    movement: [
      'Push hips back as bar descends close to legs; stand by extending hips.',
    ],
    checks: [
      'Stop where the hinge remains controlled; floor contact is unnecessary.',
    ],
    mistakes: [
      'Squatting instead: move hips back.',
      'Bar drifting: keep close.',
      'Rounding for depth: stop sooner.',
    ],
    sources: ['ace-317'],
  },
  'dumbbell-romanian-deadlift': {
    revision: 1,
    scope: 'Top-down dumbbell hip hinge.',
    setup: [
      'Stand holding dumbbells in front of thighs; soften knees and brace.',
    ],
    movement: ['Hinge hips back, keeping weights close; stand smoothly.'],
    checks: ['Let hamstring tolerance set depth; keep spine steady.'],
    mistakes: [
      'Reaching floor: stop at controlled depth.',
      'Back rounding: reset hinge.',
      'Weights drifting: keep close.',
    ],
    sources: ['hss-posterior'],
  },
  'barbell-hip-thrust': {
    revision: 1,
    scope: 'Bench-supported barbell hip extension.',
    setup: [
      'Secure bench and support upper back; stabilize a padded bar over hips and plant feet.',
    ],
    movement: [
      'Lower hips, then extend them without throwing the ribs upward.',
    ],
    checks: ['Keep feet stable and finish with hips and trunk aligned.'],
    mistakes: [
      'Bench sliding: secure it.',
      'Lumbar overextension: stop upright.',
      'Bar rolling: stabilize it.',
    ],
    sources: ['ace-367'],
    adaptation:
      'Bench-supported dumbbell bridge mechanics adapted to a padded barbell.',
  },
  'cable-glute-kickback': {
    revision: 1,
    scope: 'Standing cable hip extension.',
    setup: [
      'Secure an ankle cuff to a low pulley; hold stable support and soften standing knee.',
    ],
    movement: [
      'Move the working leg backward through the hip; return slowly. Repeat sides.',
    ],
    checks: ['Keep pelvis square and trunk steady.'],
    mistakes: [
      'Arching back: shorten range.',
      'Turning out: keep pelvis steady.',
      'Jerking cuff: reduce load.',
    ],
    sources: ['ace-hip-extension'],
    adaptation:
      "ACE's band hip-extension example is adapted to an ankle-cuff cable.",
  },
  'standing-calf-raise': {
    revision: 1,
    scope: 'Standing machine calf raise; support varies.',
    setup: [
      'Position machine support comfortably; place forefeet securely on platform and keep knees long, not forced locked.',
    ],
    movement: ['Raise heels, pause briefly, then lower under control.'],
    checks: ['Use comfortable ankle range and avoid bouncing.'],
    mistakes: [
      'Knee pumping: keep leg position.',
      'Rapid bounce: pause.',
      'Rolling ankles: keep feet stable.',
    ],
    sources: ['nasm-calves'],
    adaptation:
      'General standing-calf guidance adapted to machine support; placard governs loading and mounting.',
  },
  'seated-calf-raise': {
    revision: 1,
    scope: 'Bent-knee machine calf raise.',
    setup: [
      'Set thigh pads above knees with forefeet securely supported and heels free.',
    ],
    movement: [
      'Lift heels, pause, then lower slowly through a comfortable range.',
    ],
    checks: [
      'Keep knees bent and use the ankles rather than rocking the torso.',
    ],
    mistakes: [
      'Bouncing: pause.',
      'Pad on kneecap: reset.',
      'Feet slipping: reposition.',
    ],
    sources: ['nasm-calves'],
    adaptation:
      'Machine adaptation of seated-calf technique; machine release/safeties follow its placard.',
  },
  'machine-hip-adduction': {
    revision: 1,
    scope: 'Seated hip-adduction machine.',
    setup: [
      'Support feet and back; set a comfortable starting width with inner thighs against pads.',
    ],
    movement: ['Bring legs inward slowly, then return under control.'],
    checks: ['Hold handles and use the release mechanism before exiting.'],
    mistakes: [
      'Excessive starting width: reduce it.',
      'Torso rocking: stay supported.',
      'Stack collision: return slowly.',
    ],
    sources: ['lf-adduction'],
    adaptation:
      'Manufacturer example; exact adjustment controls vary between machines.',
  },
  'kettlebell-swing': {
    revision: 1,
    scope: 'Two-hand hip-hinge swing, not an overhead swing.',
    setup: [
      'Learn a controlled hip hinge first; grip a manageable kettlebell securely with stable feet.',
    ],
    movement: [
      'Hike bell back; extend hips to let it rise in front, then hinge for the return.',
    ],
    checks: [
      'Keep spine steady; drive from hips rather than lifting with arms.',
    ],
    mistakes: [
      'Squatting: hinge back.',
      'Arm lifting: let hips drive.',
      'Leaning back: finish tall.',
    ],
    sources: ['ace-swing'],
  },
  plank: {
    revision: 1,
    scope: 'Forearm plank; timed hold / duration.',
    setup: ['Place elbows under shoulders, support toes and brace the trunk.'],
    movement: [
      'Lift into a straight body line; breathe while holding, then lower gently.',
    ],
    checks: [
      'Keep head aligned and hips level; end when alignment cannot be maintained.',
    ],
    mistakes: [
      'Sagging back: shorten hold.',
      'Hips high: realign.',
      'Holding breath: breathe steadily.',
    ],
    sources: ['ace-32'],
  },
  'hanging-knee-raise': {
    revision: 1,
    scope: 'Hanging bent-knee raise.',
    setup: ['Grip a secure bar and establish a steady supported hang.'],
    movement: [
      'Raise knees while curling pelvis gently; lower without swinging.',
    ],
    checks: [
      'Move through controlled abdominal/pelvic action and keep shoulders supported.',
    ],
    mistakes: [
      'Kicking: reset hang.',
      'Dropping legs: lower slowly.',
      'Losing grip: stop before control fails.',
    ],
    sources: ['nasm-knee-raise'],
    adaptation:
      "Conservative hang setup supplements NASM's pelvic-control coaching guidance.",
  },
  'cable-crunch': {
    revision: 1,
    scope: 'Cable trunk flexion; posture unspecified.',
    setup: [
      'Position a high cable securely and hold attachment beside the head with hips stable.',
    ],
    movement: ['Curl ribs toward pelvis against resistance; return slowly.'],
    checks: ['Keep hands mostly as attachment supports, not pulling arms.'],
    mistakes: [
      'Hip hinging only: move ribs.',
      'Arm pulling: keep hands steady.',
      'Stack crash: slow return.',
    ],
    sources: ['ace-331'],
    adaptation:
      'Source shows standing crunch; kneeling versions need their own stable setup.',
  },
  'back-extension': {
    revision: 1,
    scope: 'Hip/back extension; machine geometry unspecified.',
    setup: [
      'For a hip-extension bench, support upper thighs with the pad below the hips and secure feet.',
    ],
    movement: [
      'Hinge down with a steady trunk; rise until body aligns, not beyond.',
    ],
    checks: [
      'For a seated lumbar machine, support feet with knees softly bent and hips against its lumbar pad; adjust the starting range. Extend the trunk smoothly into support, then return with control; follow its own placard.',
    ],
    mistakes: [
      'Hyperextension: stop aligned.',
      'Swinging: slow down.',
      'Rounding under load: reduce range.',
    ],
    sources: ['ace-back-extension', 'lf-adduction'],
    adaptation:
      'Hip-hinge bench example is explicit; it does not redefine this generic ID as one machine type.',
  },
  'dumbbell-shrug': {
    revision: 1,
    scope: 'Standing dumbbell shoulder elevation.',
    setup: ['Stand stably holding dumbbells at sides with arms long.'],
    movement: ['Raise shoulders toward ears, then lower slowly.'],
    checks: ['Keep head aligned, wrists straight and trunk steady.'],
    mistakes: [
      'Shoulder circles: move vertically.',
      'Elbow curling: keep arms long.',
      'Head jutting: stay aligned.',
    ],
    sources: ['ace-75'],
  },
  'farmers-carry': {
    revision: 1,
    scope: 'Two-dumbbell carry; distance-based.',
    setup: [
      'Pick weights up with control and establish a secure grip beside hips; clear the route.',
    ],
    movement: [
      'Walk steadily with short controlled steps; turn carefully and set weights down under control.',
    ],
    checks: ['Stay tall, breathe and keep shoulders level.'],
    mistakes: [
      'Rushing turns: slow down.',
      'Side lean: reduce load.',
      'Grip failing: stop safely.',
    ],
    sources: ['ace-359'],
    adaptation:
      "Neutral side-held grip clarifies the source's ambiguous palm wording; distance is not repetitions.",
  },
  'standing-cable-anti-rotation-press': {
    revision: 1,
    scope: 'Standing two-hand anti-rotation press; both sides.',
    setup: [
      'Stand beside a chest-height cable, feet stable; hold handle near chest.',
    ],
    movement: [
      'Press hands forward resisting rotation, then return; repeat facing the opposite side.',
    ],
    checks: ['Keep pelvis and ribs facing forward.'],
    mistakes: [
      'Trunk turning: reduce load.',
      'Back arching: brace.',
      'Cable slack: adjust distance.',
    ],
    sources: ['ace-332'],
    adaptation:
      "ACE band/cable guidance adapted to the catalog's cable configuration.",
  },
  'bodyweight-step-up': {
    revision: 1,
    scope: 'Unloaded step-up; each lead leg.',
    setup: [
      'Choose a stable platform you can control; place the whole lead foot on it.',
    ],
    movement: [
      'Rise smoothly, then step down under control; repeat each lead side.',
    ],
    checks: ['Keep knee aligned with the foot and avoid jumping.'],
    mistakes: [
      'High platform: lower height.',
      'Knee collapse: control alignment.',
      'Dropping down: lower slowly.',
    ],
    sources: ['ace-28'],
    adaptation:
      "Unloaded adaptation of ACE's dumbbell step-up; no external weight for this ID.",
  },
  'dumbbell-floor-glute-bridge': {
    revision: 1,
    scope: 'Floor-supported dumbbell hip extension.',
    setup: [
      'Lie on the floor with knees bent and feet planted; stabilize one dumbbell across hips.',
    ],
    movement: ['Press feet down and raise hips, then lower slowly.'],
    checks: ['Keep upper back on floor and ribs controlled.'],
    mistakes: [
      'Arching back: stop aligned.',
      'Weight rolling: secure it.',
      'Pushing with neck: keep head relaxed.',
    ],
    sources: ['hss-posterior'],
  },
  'lying-barbell-triceps-extension': {
    revision: 1,
    scope: 'Supine barbell elbow extension.',
    setup: [
      'Lie on a flat bench with feet supported; use a closed overhand grip and hold bar above the head/chest area.',
    ],
    movement: ['Bend elbows to lower with head clearance; extend smoothly.'],
    checks: ['Keep upper arms steady and wrists aligned.'],
    mistakes: [
      'Bar hitting head: maintain clearance.',
      'Elbows drifting: reduce load.',
      'Bent wrists: align forearms.',
    ],
    sources: ['ace-36'],
  },
} as const satisfies Record<ExerciseId, ExerciseTechnique>;
