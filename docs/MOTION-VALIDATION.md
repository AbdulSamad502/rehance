# Motion analysis: what has and has not been verified

## What is verified (automated)

`npm test` runs the real analysis pipeline (angle maths, smoothing-independent logic, rep counting, symmetry, gait, balance, posture) on a **synthetic skeleton with known angles**. It checks that, given correct landmarks, the engine recovers the commanded values:

| Check | Result |
|---|---|
| Knee / hip / elbow / shoulder angle from landmarks, 3D and 2D | within 1° |
| Knee flexion peak (commanded 112°) | 108° to 118° |
| Hip flexion peak (commanded 82°) | 78° to 88° |
| Shoulder flexion and abduction (commanded 158°) | 150° to 165° |
| Squat depth (commanded 96°) and left/right symmetry | depth > 90°, symmetry > 97% |
| Sit-to-stand cycle time (commanded 3.6 s) | 3.3 to 3.9 s |
| Walking cadence (commanded 108 steps/min) | 100 to 116 |
| Single-leg hold (commanded 10.5 s) | 9.5 to 11.5 s |
| Posture shoulder tilt (commanded 2.6°, left lower) | 2.0° to 3.2°, correct side |
| No person in view | no reps, warning shown |

This proves the **maths and logic**. It says nothing about how accurately MediaPipe locates body landmarks on a real person.

## What is NOT yet verified: do this on your laptop

1. **Does the real camera work?** Open Motion Analysis → New → Camera. The browser asks for permission. Check the live skeleton follows you.
2. **Frame rate.** The capture screen shows `GPU|CPU · fps · inference ms`. Record what your laptop gets for both the Fast and Accurate model. Target: at least 24 fps.
3. **Angle accuracy against a reference.**
   - Hold known angles using a protractor app or goniometer (for example knee at 90° and 135°, elbow at 90°).
   - Capture each side-on, camera at hip/chest height, about 2.5 m away, good light.
   - Compare the reported peak to the reference. Write the errors in the table below.
4. **Repeatability.** Capture the same movement 3 times; note the spread.
5. **Edge cases.** Loose clothing, dim light, partial occlusion, patient too close or too far. The positioning check should warn.

| Date | Device and camera | Model | Movement | Reference | Reported | Error | fps |
|---|---|---|---|---|---|---|---|
| | | | | | | | |

Until this table is filled in, describe results to clinicians as **estimates from 2D camera input**, never as clinically validated measurements.

## Known limits of the method

- 2D camera input: accuracy depends on camera placement and body orientation. The positioning check enforces side-on or front view as required.
- Landmarks are estimates; hidden or occluded limbs are guessed by the model, so tracking-quality scores and warnings gate the results.
- Gait, balance and posture metrics are indicators, not clinical gait analysis.
- The uploaded-video path uses the same pipeline; frame rate and timing follow the clip.
