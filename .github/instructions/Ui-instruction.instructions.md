---
applyTo: '**'
---
Provide project context and coding guidelines that AI should follow when generating code, answering questions, or reviewing changes.



# ✅ **UI Instructions for Copilot **

**UI PRINCIPLES**

* UI must be **simple, plain, and functional**, similar to writing raw HTML with only minimal, necessary CSS.
* Avoid modern fancy UI elements such as animations, shadows, gradients, large icons, or colorful visuals.
* Use **basic layout only** – flex, grid, or simple containers when required.
* Colors must be neutral and minimal: mostly **black, white, grayscale**.
* Prefer **semantic HTML**: `<form>`, `<label>`, `<input>`, `<button>`, `<table>`, `<section>`, etc.
* Use minimal CSS only for spacing, alignment, and readability (e.g., small margins, padding, simple borders).
* No UI libraries (Material UI, Tailwind, Chakra, Bootstrap, etc.) unless explicitly told.
* The UI must feel like **early web pages**, but clean and organized.

**REUSABILITY REQUIREMENTS**

* Never duplicate UI code.
* Any repeated UI pattern **must be extracted into a reusable component**.
* Examples of reusable components:

  * `<InputField label="Room Name" />`
  * `<TimePicker value={} onChange={} />`
  * `<RoomCard room={room} />`
  * `<Table headers={} rows={} />`
  * `<ErrorMessage text={} />`
  * `<Loader />`
* Keep components **small, focused, and predictable**.

**STRUCTURE & CLARITY**

* The core pages must be extremely clear and minimal:

  * **Rooms Page:** list of rooms in a simple table or vertical list.
  * **Booking Page:** basic form with labeled inputs.
  * **Admin View:** table for bookings + a simple fetch button for analytics.
* Avoid unnecessary abstraction; use components only when they reduce duplication.
* Do not nest too many components; keep folder structure flat and clear.
* Keep logic separated from UI; components should be primarily presentational.

**WRITING STYLE**

* Always use meaningful names for components, variables, and states.
* Add **short comments** to describe non-obvious logic.
* Keep everything readable and simple—prefer clarity over reactivity complexity.

