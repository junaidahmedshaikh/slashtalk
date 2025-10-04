export const sampleUsers = [
  { id: "u_sana", name: "sana shaikh", online: true, about: "Design @ SlashRTC" },
  { id: "u_avi", name: "Avi L.", online: false, about: "Frontend enthusiast" },
  { id: "u_sam", name: "Sam Patel", online: true, about: "Product ops" },
  { id: "u_Axar", name: "Axar Patel", online: false, about: "Engineer" },
]

export function sampleMessagesFor(userId) {
  const base = [
    { id: "m1", from: "other", text: "Hey! How's it going?", time: "10:12" },
    { id: "m2", from: "me", text: "All good! Working on SlashChat UI.", time: "10:13" },
    {
      id: "m3",
      from: "other",
      text: "Nice! The indigo/purple looks great.",
      time: "10:14",
    },
  ]
  if (userId === "u_sana") return base
  if (userId === "u_avi")
    return [
      { id: "m1", from: "other", text: "Ship it today?", time: "09:45" },
      { id: "m2", from: "me", text: "Yes, polishing now.", time: "09:46" },
    ]
  return base
}
