# Voice: Speak instead of typing

Put back on 2026-10-15. The owner: "It's easier to say than write."

It was removed on 2026-10-05 because the old voice (an orb that listened and acted) failed often and misheard names. The new one is narrower on purpose.

## How it works

- A **Speak** button beside the chat box, and under every text box in a dialog (the journal form, for example).
- Press it and talk. The words appear in the box as they are heard.
- **Nothing is sent, saved or changed until Send or Save.** The person sees the words first and can fix a misheard one. Voice never changes the board by itself, so the old rule that spoken deletes must be staged is not needed: every spoken sentence is checked by eye before it is sent.
- Press Speak again to stop. Send, or closing the dialog, also stops it. Nothing listens when the page loads.
- English (the device language if it is English, otherwise US English), as decided for the tutor.

## Privacy

- The browser turns the voice into text with its own speech service: Google in Chrome and on Android, Apple in Safari. The audio goes there, not to the board's server. The first time, the note line says so.
- The board keeps only the text. No audio is stored, and no `getUserMedia` call is made.
- For F9 (legal pages): name the browser's speech service as a processor the person chooses by pressing Speak.

## Limits

- Firefox has no speech service: the button says to use the keyboard's microphone.
- An installed iPhone Home Screen app may not offer speech recognition; the keyboard's microphone always works there.
- Real devices are not tested from here. `tests/voice.mjs` (16 checks) uses a stand-in speech service: Speak starts it, words land in the box, nothing is sent before Send, a spoken journal entry is saved as said, stop, Send stops it, blocked and silent cases, the journal form, closing stops it, no speech service, and the phone layout.
