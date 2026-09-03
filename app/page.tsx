"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Meal, seedMeals } from "./lib/seed";

export default function Home() {
  const [meals, setMeals] = useState<Meal[]>(seedMeals);
  const [category, setCategory] = useState("Everything");
  const [selected, setSelected] = useState<Meal | null>(null);
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [editing, setEditing] = useState<Meal | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    fetch("/api/meals").then((response) => response.ok ? response.json() : Promise.reject()).then(setMeals).catch(() => undefined);
    fetch("/api/session").then((response) => response.json()).then((data) => setAuthenticated(Boolean(data.authenticated))).catch(() => undefined);
  }, []);

  const categories = ["Everything", ...Array.from(new Set(meals.filter((meal) => meal.available).map((meal) => meal.category)))];
  const activeCategory = categories.includes(category) ? category : "Everything";
  const available = useMemo(
    () => meals.filter((meal) => meal.available && (activeCategory === "Everything" || meal.category === activeCategory)),
    [activeCategory, meals],
  );

  function openOwner() {
    if (authenticated) setDashboardOpen(true); else setLoginOpen(true);
  }

  async function toggleMeal(meal: Meal) {
    const response = await fetch(`/api/meals/${meal.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ available: !meal.available }) });
    if (response.ok) setMeals(await response.json());
    else if (response.status === 401) { setAuthenticated(false); setDashboardOpen(false); setLoginOpen(true); }
  }

  async function saveMeal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const meal: Meal = {
      id: editing?.id || Date.now(),
      name: String(data.get("name")),
      description: String(data.get("description")),
      price: Number(data.get("price")),
      category: String(data.get("category")),
      ingredients: String(data.get("ingredients")).split(",").map((item) => item.trim()).filter(Boolean),
      recipe: String(data.get("recipe")).split("\n").map((item) => item.trim()).filter(Boolean),
      available: data.get("available") === "on",
    };
    const response = await fetch("/api/meals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(meal) });
    if (response.ok) { setMeals(await response.json()); setEditing(null); }
    else if (response.status === 401) { setAuthenticated(false); setDashboardOpen(false); setLoginOpen(true); }
  }

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError("");
    const password = String(new FormData(event.currentTarget).get("password"));
    const response = await fetch("/api/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
    if (!response.ok) { const data = await response.json(); setLoginError(data.error ?? "Unable to sign in."); return; }
    setAuthenticated(true); setLoginOpen(false);
    const mealsResponse = await fetch("/api/meals");
    if (mealsResponse.ok) setMeals(await mealsResponse.json());
    setDashboardOpen(true);
  }

  async function logout() {
    await fetch("/api/session", { method: "DELETE" });
    setAuthenticated(false); setDashboardOpen(false); setEditing(null);
    const mealsResponse = await fetch("/api/meals");
    if (mealsResponse.ok) setMeals(await mealsResponse.json());
  }

  return (
    <main>
      <header className="masthead">
        <a href="#available" className="wordmark"><span className="brand-disc">S&amp;S</span><span className="brand-name">Sweet &amp; Spicy <i>African Foods</i></span></a>
        <div className="masthead-note">Home-cooked meals<br />posted when ready</div>
        <button className="dashboard-link" onClick={openOwner}>{authenticated ? "Manage meals" : "Owner sign in"}</button>
      </header>

      <section className="intro" id="available">
        <div className="intro-copy">
          <div className="intro-kicker"><span className="live-dot" /> Availability board</div>
          <h1>Here&apos;s what&apos;s<br /><i>ready right now.</i></h1>
          <div className="intro-details">
            <p>Meals are made when time and ingredients allow. There&apos;s no fixed menu or schedule.</p>
            <p><strong>First come, first served.</strong><br />Ask directly to claim a meal.</p>
          </div>
        </div>
        <figure className="brand-poster">
          <Image src="/media/logo.png" alt="Sweet and Spicy African Foods logo, prepared foods, spices, and phone number 937 580 1373" width={4682} height={6294} priority sizes="(max-width: 800px) 88vw, 31vw" />
          <figcaption>West African food and seasonings · Dayton, Ohio</figcaption>
        </figure>
        <div className="stamp" aria-hidden="true">Updated<br />as needed</div>
      </section>

      <section className="board">
        <div className="board-toolbar">
          <h2>Available</h2>
          <div className="category-list" aria-label="Filter available meals">
            {categories.map((item) => <button key={item} className={activeCategory === item ? "current" : ""} onClick={() => setCategory(item)}>{item}</button>)}
          </div>
        </div>

        <div className="meal-list">
          {available.length === 0 && <div className="empty-state"><span>Nothing posted</span><p>Check back later. This board changes whenever a meal is ready.</p></div>}
          {available.map((meal, index) => (
            <article className="meal-row" key={meal.id}>
              <div className="meal-number">{String(index + 1).padStart(2, "0")}</div>
              <div className="meal-copy"><span>{meal.category}</span><h3>{meal.name}</h3><p>{meal.description}</p></div>
              <div className="meal-price"><strong>${meal.price}</strong><small>per meal</small></div>
              <button className="details-button" onClick={() => setSelected(meal)}>Ingredients &amp; preparation <span>↗</span></button>
            </article>
          ))}
        </div>

        <aside className="board-footnote"><strong>Good to know</strong><p>Availability can change quickly. The board confirms what is being offered—not a reservation.</p></aside>
      </section>

      <section className="welcome-band" aria-label="Welcome from Sweet and Spicy African Foods">
        <div className="welcome-copy"><span>Welcome · Akwaaba</span><p>A little piece of the business, in sound.</p></div>
        <div className="theme-player">
          <div><strong>Sweet &amp; Spicy Theme Song</strong><small>Created for Sweet &amp; Spicy African Foods</small></div>
          <audio controls preload="none" aria-label="Play the Sweet and Spicy African Foods theme song">
            <source src="/media/sweet-and-spicy-theme.mp3" type="audio/mpeg" />
            Your browser does not support audio playback.
          </audio>
        </div>
      </section>

      <footer><span>Sweet &amp; Spicy Meal Board</span><p>Call or text <a href="tel:+19375801373">937 580 1373</a></p><button onClick={openOwner}>Owner access</button></footer>

      {selected && <div className="scrim" onMouseDown={() => setSelected(null)}>
        <section className="meal-sheet" role="dialog" aria-modal="true" aria-labelledby="meal-title" onMouseDown={(event) => event.stopPropagation()}>
          <button className="close-button" onClick={() => setSelected(null)} aria-label="Close details">Close ×</button>
          <div className="sheet-index">Meal note / {selected.category}</div>
          <h2 id="meal-title">{selected.name}</h2>
          <p className="sheet-description">{selected.description}</p>
          <div className="sheet-columns">
            <div><h3>Ingredients</h3><ul>{selected.ingredients.map((item) => <li key={item}>{item}</li>)}</ul></div>
            <div><h3>Preparation</h3><ol>{selected.recipe.map((step) => <li key={step}>{step}</li>)}</ol></div>
          </div>
          <div className="sheet-action"><span>${selected.price} per meal</span><p>Contact the cook directly to ask about this meal.</p></div>
        </section>
      </div>}

      {loginOpen && <div className="scrim" onMouseDown={() => setLoginOpen(false)}>
        <form className="login-card" onSubmit={login} onMouseDown={(event) => event.stopPropagation()} aria-labelledby="login-title">
          <button className="close-button" type="button" onClick={() => setLoginOpen(false)}>Close x</button>
          <span>Owner only</span><h2 id="login-title">Sign in to manage meals</h2>
          <label>Password<input name="password" type="password" autoComplete="current-password" autoFocus required /></label>
          {loginError && <p className="login-error" role="alert">{loginError}</p>}
          <button className="save-button" type="submit">Sign in</button>
        </form>
      </div>}

      {dashboardOpen && authenticated && <div className="scrim dashboard-scrim" onMouseDown={() => setDashboardOpen(false)}>
        <section className="dashboard" role="dialog" aria-modal="true" aria-labelledby="dashboard-title" onMouseDown={(event) => event.stopPropagation()}>
          <div className="dashboard-heading"><div><span>Private controls</span><h2 id="dashboard-title">Meal board</h2></div><button className="close-button" onClick={() => setDashboardOpen(false)}>Close x</button></div>
          <button className="signout-button" onClick={logout}>Sign out</button>
          <p>Switch a meal on to show it publicly. Switch it off to remove it from the board.</p>
          <div className="dashboard-list">
            {meals.map((meal) => <div className="dashboard-row" key={meal.id}>
              <div><strong>{meal.name}</strong><small>{meal.category} · ${meal.price}</small></div>
              <button className={`switch ${meal.available ? "on" : ""}`} onClick={() => toggleMeal(meal)} aria-pressed={meal.available}><span />{meal.available ? "Posted" : "Hidden"}</button>
              <button className="text-button" onClick={() => setEditing(meal)}>Edit</button>
            </div>)}
          </div>
          <button className="new-button" onClick={() => setEditing({ id: 0, name: "", description: "", price: 0, category: "", ingredients: [], recipe: [], available: true })}>+ Add a meal</button>

          {editing && <form className="edit-form" onSubmit={saveMeal}>
            <div className="form-heading"><h3>{editing.id ? "Edit meal" : "New meal"}</h3><button type="button" onClick={() => setEditing(null)}>Cancel</button></div>
            <label>Meal name<input name="name" defaultValue={editing.name} required /></label>
            <label>Short description<textarea name="description" defaultValue={editing.description} required /></label>
            <div className="field-pair"><label>Price<input name="price" type="number" min="0" step="0.5" defaultValue={editing.price} required /></label><label>Category<input name="category" defaultValue={editing.category} required /></label></div>
            <label>Ingredients <small>Separate with commas</small><textarea name="ingredients" defaultValue={editing.ingredients.join(", ")} required /></label>
            <label>Preparation <small>One step per line</small><textarea name="recipe" defaultValue={editing.recipe.join("\n")} required /></label>
            <label className="check-field"><input name="available" type="checkbox" defaultChecked={editing.available} /> Post this meal now</label>
            <button className="save-button" type="submit">Save meal</button>
          </form>}
        </section>
      </div>}
    </main>
  );
}
