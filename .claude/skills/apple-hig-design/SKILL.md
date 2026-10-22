---
name: "apple-hig-design"
description: "Design or review an app, screen, flow or UI so it feels Apple-like: clear, content-first, forgiving, accessible and ergonomic. Use for UI design, UX review and design-system decisions on any platform."
---

# Apple-like solution design (HIG principles)

Use this skill to design or review software the way Apple's Human Interface Guidelines (HIG) do.
The skill applies to native Apple apps and to web or cross-platform apps that must feel Apple-like.
This skill covers interface and interaction design. For pricing, retention and moat questions, use `apple-principals`.

## 1. The core contract

The technology adapts to the person. The person does not adapt to the technology.

Every decision must reduce the mental work a user does to operate the software. Users have limited attention. Spend it on their task, not on your interface.

## 2. The 3 pillars (use as a filter on every element)

### Clarity
- The user must understand each element without a learning curve.
- An interactive element must look interactive. A static element must not.
- Text must stay readable at all sizes.
- Use color for meaning, not for decoration. Red means destructive. The accent color means tappable.
- Test: if a user must stop to decide "is this a button?", the design fails.

### Deference
- The content is the product. The interface is the container.
- Remove chrome: heavy borders, frames, boxes and ornaments.
- Let content go edge to edge where possible.
- Show controls when the user needs them. Let them recede when the user does not.
- Test: remove each element. If nothing gets worse, keep it removed.

### Depth
- Use layers to show hierarchy and context.
- A temporary state (sheet, modal, popover) sits above the main view. The main view stays visible, dimmed or blurred, so the user knows the context is paused, not lost.
- Use subtle shadow, translucency and blur. Do not stack many layers.
- Test: the user can always say where they are and how to go back.

## 3. Interaction principles

1. **Consistency.** Use the patterns users already know. Knowledge from one screen must work on the next screen and in other apps. Do not override standard gestures (for example, edge-swipe for back).
2. **Discoverability.** A user must find each feature without documentation. A hidden gesture can be a shortcut. It must never be the only path. Always give a visible control too.
3. **Forgiveness.** Make every action reversible where possible. Give Undo. Ask for confirmation only for destructive actions that you cannot undo. Data loss is a system bug, not a user error.
4. **Autonomy.** Give users the information to decide. No forced flows, no dark patterns, no lock-in tricks.
5. **Anticipation.** Pre-fill known data. Show the likely next option in context. Do not make the user ask for what the system already knows.
6. **Feedback and latency.**
   - Under 100 ms: feels instant. Target this for direct manipulation.
   - Over 100 ms: show a response (pressed state, optimistic update).
   - About 1 s or more: show progress (skeleton screen, progress indicator).
   - Never show a frozen screen with no signal.
7. **Direct manipulation.** The user acts on the object, not on a description of the object. Drag the item. Pinch the photo.
8. **Modelessness.** Avoid hidden modes that change what an input does. If a mode is necessary, make it visible and easy to leave.

## 4. Ergonomics (Fitts's Law)

Time to hit a target grows with distance and shrinks with target size. Design for this.

- Make important targets large. Put them close to where the hand or pointer already is.
- The hit area can be larger than the visible element. Extend it.
- Screen edges and corners are fast targets for a pointer, because the pointer cannot overshoot.
- On phones, put primary navigation and primary actions in the bottom part of the screen (thumb zone). Use a bottom tab bar for top-level navigation.
- Put rare or destructive actions further away from frequent actions.

Baseline hit-area sizes (default / minimum, in points):

| Platform | Default | Minimum | Default text | Minimum text |
|---|---|---|---|---|
| iOS, iPadOS | 44x44 | 28x28 | 17 | 11 |
| macOS | 28x28 | 20x20 | 13 | 10 |
| watchOS | 44x44 | 28x28 | 16 | 12 |
| tvOS | 66x66 | 56x56 | 29 | 23 |
| visionOS | 60x60 | 28x28 | 17 | 12 |

For web on touch devices, use 44x44 CSS px as the default hit area.

## 5. Platform fit

Do not port one layout to every device. Adapt to the input method and context.

- **iPhone:** touch first, one hand, focused screens, standard gestures, bottom navigation.
- **iPad:** real adaptive layouts, not a stretched phone. Support split view, rotation and sidebars. Never leave a phone-width column in the middle of a large screen.
- **Mac:** precision pointer and keyboard. Denser layouts, toolbars, full menus, keyboard shortcuts for every frequent action.
- **Watch:** glanceable. One task, a few seconds, large targets.
- **TV:** focus-based navigation from a distance. Large text and targets.
- **Spatial (visionOS):**
  - Put primary content at eye level, in the center of view. Keep vertical placement inside a comfortable range to avoid neck strain.
  - Place content at a natural distance (about 1 to 2 m). Never put content closer than arm's length.
  - Anchor content to the room (world-locked). Do not lock content to the head.
  - Use translucent materials so the real room stays visible.
  - Show a hover highlight before selection, because eye gaze is less precise than a finger.
  - Use small depth offsets for hierarchy. Do not open many overlapping windows.

## 6. Accessibility is architecture, not a final check

- **Scalable text.** Never hard-code font sizes. Use semantic text styles (Title, Headline, Body, Caption). At the largest size, text must wrap. It must not truncate or overlap.
- **Screen readers.** Give every control a descriptive label. Hide decorative images from assistive technology. Test the full flow with the screen reader on.
- **Contrast.** Minimum 4.5:1 for normal text. Minimum 3:1 for large text and essential UI parts. Check both light and dark mode.
- **Reduce Motion.** When the user enables it, replace zoom, scale and spring animations with simple cross-fades.
- **Color is never the only signal.** Add a shape, icon or label.

## 7. Visual system

- **Semantic color tokens.** Use tokens such as `background`, `label`, `secondaryLabel`, `accent`, `destructive`. Do not use raw hex values in components. Tokens change with light and dark mode.
- **Dark mode.** Use dark gray backgrounds (for example #1C1C1E), not pure black, so depth and shadow stay visible. Never force one mode. Follow the system setting.
- **Restraint.** One accent color. A neutral base. Let the user's content give the color.
- **Typography carries hierarchy.** Use size, weight and spacing before you add boxes or lines.
- **Icons work like type.** Use one icon family. Match icon weight and size to the adjacent text. Align icons to the text baseline.
- **Motion has a fixed vocabulary.** Each animation means one thing everywhere: bounce = success, pulse = work in progress, replace = state change, appear/disappear = enter/leave. Never animate only for decoration.

## 8. Build so the right path is the easy path

- On Apple platforms, use native SwiftUI components (NavigationStack, List, Button, Toggle, sheets) and SF Symbols. They give correct spacing, type, physics and accessibility for free. A custom control costs more code and usually loses quality.
- On web or cross-platform, build the same effect with a design system: tokens for color, type and spacing; components that include states, hit areas, focus rings and accessibility labels; a motion module with the fixed vocabulary.
- Do not mix platform languages. No Android floating action button or Material back arrow on iOS.
- Keep sign-in inside the app. Do not send the user to an external browser for login.
- Supply sharp assets for every display density.

## 9. Workflow

1. **Content first.** List the user's content and primary task before you draw any chrome.
2. **Pick the platform pattern.** Choose the standard navigation model for the device (tab bar, sidebar, split view, focus, spatial window).
3. **Lay out with ergonomics.** Place primary actions in the reachable zone with correct hit areas.
4. **Apply the pillars.** Run clarity, deference and depth tests on each element.
5. **Add states.** Define default, pressed, disabled, loading, empty, error and success states for each component.
6. **Accessibility pass.** Largest text size, screen reader, contrast in both modes, Reduce Motion.
7. **Flaw hunt.** Run the review checklist below and report every failure before you build.

## 10. Review checklist (find flaws first)

For each item, report PASS or FAIL with the exact element and a fix.

- [ ] Can a new user tell what is tappable on each screen, with no hints?
- [ ] Is there any feature that is reachable only by a hidden gesture?
- [ ] Can the user undo every non-trivial action? Is each destructive action clearly marked and confirmed?
- [ ] Does each action respond in under 100 ms, and does each wait over 1 s show progress?
- [ ] Are all hit areas at or above the platform default size?
- [ ] Are primary actions in the thumb zone (phone) or reachable by keyboard (Mac)?
- [ ] Does the layout adapt to tablet, landscape and split screen?
- [ ] Does all text use semantic styles and survive the largest size?
- [ ] Does every control have a screen-reader label?
- [ ] Do contrast ratios pass in light and dark mode?
- [ ] Does Reduce Motion remove scale and spring animations?
- [ ] Is color used only with meaning, and never as the only signal?
- [ ] Can any element be removed with no loss?
- [ ] Does the user always know where they are and how to go back?
- [ ] Does any pattern come from another platform's design language?

## 11. Anti-patterns

- Flat design that removes all signifiers, so users tap at random to find controls.
- Gesture-only actions such as "shake to undo" with no visible alternative.
- Decorative color and gradients that compete with content.
- Hard-coded font sizes and hex colors.
- Pure black dark mode with no visible depth.
- Spinners with no context for long tasks.
- Confirmation dialogs on every action (they train users to click through), but no Undo.
- Stretched phone layouts on tablets and desktops.

## 12. Note on the tension

Minimalism and discoverability pull in opposite directions. When they conflict, choose discoverability. A clean screen that users cannot operate is a failure. Apple itself moved back toward visible depth and signifiers after critique of strict flat design.
