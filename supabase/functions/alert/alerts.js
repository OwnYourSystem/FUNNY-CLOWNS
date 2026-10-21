/* The words of an alert mail. Plain code with no imports, so the function and the tests share it.
   An alert carries a kind, a state and counts. Never an address, a key or anything a person typed. */
const KINDS = {
  job_stopped: {
    title: "the push job has stopped",
    meaning: "Reminders are not being sent. The once-a-minute job has not finished a good run for 15 minutes while devices are subscribed.",
    check: "Look at the push function's logs, and at push_status_now in the database. Redeploy the push function if it errors."
  },
  send_failures: {
    title: "push sends are failing",
    meaning: "In the last 24 hours, more than 20% of due reminders failed to send, or none were sent while some failed. Dead addresses do not count.",
    check: "Look at the push function's logs for the error code. A change at the push services or an expired signing key are the usual causes."
  },
  nothing_sent: {
    title: "no push has been sent for 36 hours",
    meaning: "Devices are subscribed, but no reminder has gone out for 36 hours.",
    check: "Check that the schedule times of the subscribed devices are sensible, and that the push job is running."
  },
  test: {
    title: "test alert",
    meaning: "This is a test. Alert mail is set up and working.",
    check: "Nothing to do."
  }
};
export function compose(kind, state, detail) {
  const k = KINDS[kind];
  if (!k) return null;
  const resolved = state === "resolved";
  const subject = "[Board] " + (kind === "test" ? "Test alert" : (resolved ? "Recovered: " : "Alert: ") + k.title);
  const lines = resolved
    ? ["It has recovered: " + k.title + ".", "", "Detail: " + String(detail || "").slice(0, 300)]
    : [k.meaning, "", "Detail: " + String(detail || "").slice(0, 300), "", "What to check: " + k.check];
  lines.push("", "You get one mail when an alert opens and one when it clears. This message holds counts only.");
  return { subject, text: lines.join("\n") };
}
export const ALERT_KINDS = Object.keys(KINDS);
