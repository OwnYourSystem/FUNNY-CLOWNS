# Minimum Deliveries Board

One page for main tasks, subtasks and the docks of the day (Today, Waiting,
Done today), with a typed assistant, a private journal, and reminders you set.

This branch is the deployable app. The root of it is what a host serves.

    index.html              the whole board, one file, built from source/
    manifest.webmanifest    what makes it installable to a home screen
    sw.js                   the offline cache, and the push reminders
    icon-*.png              the home screen icons
    vercel.json             cache headers, and microphone=() (the board has none)
    api/tutor.js            the hosted tutor (parked, not called)
    supabase/               the push server: function and migrations
    source/                 the board in parts, and build.sh

## Changing the board

The page ships as one file, but it is written in parts: `source/parts/*.js`
between `source/head.html` and `source/tail.html`. An engine part decides
(day size, picks, reasons, numbers); a `.screen.js` part draws; a `.store.js`
part reads and writes the device. After any change run:

    source/build.sh

It writes `source/delivery-board.html` and `index.html`. Never edit
`index.html` by hand.

## Deploying

Any static host serves this branch as it stands. On Vercel the project is
`funny-clowns`; each branch gets its own link, and production is promoted by
hand.

The push server is separate: run new files in `supabase/migrations` first,
then deploy `supabase/functions/push`.

## The data

The board lives in `localStorage` on the device. The weekly check-in and the
journal live under their own keys on the device only: not synced, not in the
backup text. An optional account carries the board (not those two) between
devices. The push server holds a device address, a time zone and the
reminder times the person set, never a task or any words.
