/* ---------------- the panels hold still ----------------
   Every panel used to answer scroll at its own rate, by position and by
   velocity, plus a lean when a device tilted: depth, the same idea as the
   drone camera above. It read as alive on a desktop. On a phone it was
   seasickness, so it was cut there first. It turned out width was the
   wrong test for "does this device get carried": a tablet is wide enough
   to pass the same test a desktop passes, held in a hand the same way a
   phone is, and it floated exactly the same way a phone did. Rather than
   chase a better test, the depth is gone outright. The grid holds its
   place and the goals you are reading do not drift while you read them,
   on a desk, in a hand, or anywhere else.                                */

