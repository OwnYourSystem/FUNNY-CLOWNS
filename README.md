# Minimum Deliveries Board

One page for main tasks, subtasks and the three docks of the day, with a
tutor you press and talk to.

This branch is the deployable app. The root of it is what a host serves.

    index.html              the whole board, one file, no build step
    manifest.webmanifest    what makes it installable to a home screen
    sw.js                   the cache that lets it open with no network
    icon-*.png              the home screen icons
    vercel.json             cache headers, and the microphone permission
    source/                 the same file with the artifact markers in it

## Deploying

Any static host serves this branch as it stands. There is nothing to
build and nothing to install.

On Vercel: import the repository, set the production branch to `app`,
leave the root directory alone, framework preset Other.

## Why it has its own address

The board reads and writes nothing but the browser it runs in. The one
thing it cannot do inside an embedded frame is reach the microphone: a
browser gives that only to a page the outer page has granted it to, and
an artifact frame does not. Served as a page of its own, the browser
asks once and the voice tutor works.

## The data

Everything lives in `localStorage` on the device. Nothing is sent
anywhere. The backup box at the bottom of the board moves a board from
one device to another as text.
