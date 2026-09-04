"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Meal, seedMeals } from "./lib/seed";

async function responseError(response: Response, fallback: string) {
  try {
    const result = await response.json();
    return typeof result.error === "string" ? result.error : fallback;
  } catch {
    return fallback;
  }
}

async function prepareMealPhoto(file: File) {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const width = 1600;
  const height = 1200;
  const scale = Math.min(width / bitmap.width, height / bitmap.height);
  const drawWidth = Math.round(bitmap.width * scale);
  const drawHeight = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser could not prepare the photo.");
  context.fillStyle = "#e9e0cf";
  context.fillRect(0, 0, width, height);
  context.drawImage(bitmap, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.86));
  if (!blob) throw new Error("This browser could not prepare the photo.");
  return new File([blob], "meal-photo.webp", { type: "image/webp" });
}

export default function Home() {
  const [meals, setMeals] = useState<Meal[]>(seedMeals);
  const [category, setCategory] = useState("Everything");
  const [selected, setSelected] = useState<Meal | null>(null);
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [editing, setEditing] = useState<Meal | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [photoPreview, setPhotoPreview] = useState("");
  const [heroImageIndex, setHeroImageIndex] = useState(0);

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
  const heroMeals = useMemo(() => meals.filter((meal) => meal.available && meal.imageKey), [meals]);
  const activeHeroMeal = heroMeals.length ? heroMeals[heroImageIndex % heroMeals.length] : null;

  useEffect(() => {
    if (heroMeals.length < 2) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setHeroImageIndex((current) => (current + 1) % heroMeals.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [heroMeals.length]);

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
    setFormError("");
    setSaving(true);
    const data = new FormData(event.currentTarget);
    let imageKey = data.get("removeImage") === "on" ? undefined : editing?.imageKey;
    const image = data.get("image");
    if (image instanceof File && image.size > 0) {
      let preparedImage: File;
      try {
        preparedImage = await prepareMealPhoto(image);
      } catch (error) {
        setFormError(error instanceof Error ? error.message : "The photo could not be prepared.");
        setSaving(false);
        return;
      }
      const upload = new FormData();
      upload.set("image", preparedImage);
      const uploadResponse = await fetch("/api/uploads", { method: "POST", body: upload });
      if (!uploadResponse.ok) {
        setFormError(await responseError(uploadResponse, "The photo could not be uploaded."));
        setSaving(false);
        return;
      }
      imageKey = (await uploadResponse.json()).imageKey;
    }
    const meal: Meal = {
      id: editing?.id || Date.now(),
      name: String(data.get("name")),
      description: String(data.get("description")),
      price: Number(data.get("price")),
      category: String(data.get("category")),
      ingredients: String(data.get("ingredients")).split(",").map((item) => item.trim()).filter(Boolean),
      recipe: String(data.get("recipe")).split("\n").map((item) => item.trim()).filter(Boolean),
      available: data.get("available") === "on",
      imageKey,
    };
    const response = await fetch("/api/meals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(meal) });
    if (response.ok) { setMeals(await response.json()); setEditing(null); setPhotoPreview(""); }
    else if (response.status === 401) { setAuthenticated(false); setDashboardOpen(false); setLoginOpen(true); }
    else { setFormError(await responseError(response, "The meal could not be saved.")); }
    setSaving(false);
  }

  function previewPhoto(event: ChangeEvent<HTMLInputElement>) {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    const file = event.target.files?.[0];
    setPhotoPreview(file ? URL.createObjectURL(file) : "");
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
        <a href="#top" className="wordmark" aria-label="Sweet and Spicy African Foods home"><Image src="/media/header-logo.png" alt="Sweet and Spicy African Foods" width={300} height={90} priority /></a>
        <nav aria-label="Main navigation"><a href="#available">Available meals</a></nav>
        <div className="header-actions"><button className="dashboard-link" onClick={openOwner}><span className="owner-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><circle cx="9" cy="7" r="3.25" /><path d="M3.5 17.5c.4-3.1 2.2-5 5.5-5 1.4 0 2.6.3 3.5 1" /><rect x="13" y="14" width="7.5" height="6.5" rx="1.25" /><path d="M15 14v-1.25a1.75 1.75 0 0 1 3.5 0V14" /></svg></span>{authenticated ? "Manage meals" : "Owner sign in"}</button><a className="call-button" href="tel:+19375801373"><span aria-hidden="true">☎</span> Call 937 580 1373</a></div>
      </header>

      <section className="intro" id="top">
        <div className="intro-copy">
          <h1>Fresh African meals,<br />ready when you are</h1>
          <div className="heritage-stripe" aria-hidden="true"><i /><i /><i /></div>
          <p>Made fresh in small batches.</p>
          <a href="#available">See what&apos;s available <span>↓</span></a>
        </div>
        <div className="hero-photo">
          {activeHeroMeal ? <Image key={activeHeroMeal.imageKey} src={`/api/images/${activeHeroMeal.imageKey}`} alt={`${activeHeroMeal.name}, available now`} fill priority unoptimized sizes="(max-width: 760px) 100vw, 54vw" /> : <Image src="/media/hero-meal.png" alt="A spread of West African dishes and fresh ingredients" fill priority sizes="(max-width: 760px) 100vw, 54vw" />}
          {heroMeals.length > 1 && <div className="hero-dots" aria-label={`${(heroImageIndex % heroMeals.length) + 1} of ${heroMeals.length} available meal photos`}>{heroMeals.map((meal, index) => <span className={index === heroImageIndex % heroMeals.length ? "current" : ""} key={meal.id} />)}</div>}
        </div>
      </section>

      <section className="board" id="available">
        <div className="board-toolbar">
          <h2><span aria-hidden="true">—</span> Available Today <span aria-hidden="true">—</span></h2>
          <div className="category-list" aria-label="Filter available meals">
            {categories.map((item) => <button key={item} className={activeCategory === item ? "current" : ""} onClick={() => setCategory(item)}>{item === "Everything" ? "All" : item}</button>)}
          </div>
        </div>

        <div className="meal-list">
          {available.length === 0 && <div className="empty-state"><span>Nothing posted</span><p>Check back later. This board changes whenever a meal is ready.</p></div>}
          {available.map((meal, index) => (
            <article className={`meal-row ${meal.imageKey ? "has-photo" : ""}`} key={meal.id}>
              {meal.imageKey ? <div className="meal-photo"><Image src={`/api/images/${meal.imageKey}`} alt={meal.name} width={480} height={360} unoptimized /></div> : <div className="meal-photo meal-photo-placeholder"><span>{String(index + 1).padStart(2, "0")}</span></div>}
              <div className="meal-copy"><span>{meal.category}</span><h3>{meal.name}</h3><p>{meal.description}</p></div>
              <div className="meal-price"><strong>${meal.price}</strong></div>
              <button className="details-button" onClick={() => setSelected(meal)}><span aria-hidden="true">✓</span> Available · View details</button>
            </article>
          ))}
        </div>

        <aside className="board-footnote">Availability changes as meals sell. First come, first served.</aside>
      </section>

      <section className="welcome-band" id="about" aria-label="Welcome from Sweet and Spicy African Foods">
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
          {selected.imageKey && <Image className="sheet-photo" src={`/api/images/${selected.imageKey}`} alt={selected.name} width={1200} height={800} unoptimized />}
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
              <button className="text-button" onClick={() => { setFormError(""); setPhotoPreview(""); setEditing(meal); }}>Edit</button>
            </div>)}
          </div>
          <button className="new-button" onClick={() => { setFormError(""); setPhotoPreview(""); setEditing({ id: 0, name: "", description: "", price: 0, category: "", ingredients: [], recipe: [], available: true }); }}>+ Add a meal</button>

          {editing && <form className="edit-form" onSubmit={saveMeal}>
            <div className="form-heading"><h3>{editing.id ? "Edit meal" : "New meal"}</h3><button type="button" onClick={() => setEditing(null)}>Cancel</button></div>
            <label>Meal name<input name="name" defaultValue={editing.name} required /></label>
            <label>Short description<textarea name="description" defaultValue={editing.description} required /></label>
            <div className="field-pair"><label>Price<input name="price" type="number" min="0" step="0.5" defaultValue={editing.price} required /></label><label>Category<input name="category" defaultValue={editing.category} required /></label></div>
            <label>Ingredients <small>Separate with commas</small><textarea name="ingredients" defaultValue={editing.ingredients.join(", ")} required /></label>
            <label>Preparation <small>One step per line</small><textarea name="recipe" defaultValue={editing.recipe.join("\n")} required /></label>
            <label>Meal photo <small>Take or choose a photo. The whole image will be fitted into a consistent frame.</small><input name="image" type="file" accept="image/jpeg,image/png,image/webp" onChange={previewPhoto} /></label>
            {photoPreview && <div className="photo-preview"><span>New photo preview</span><Image src={photoPreview} alt="Preview of the selected meal photo" width={480} height={360} unoptimized /></div>}
            {editing.imageKey && <div className="current-photo"><Image src={`/api/images/${editing.imageKey}`} alt={`Current photo of ${editing.name}`} width={240} height={160} unoptimized /><label className="check-field"><input name="removeImage" type="checkbox" /> Remove current photo</label></div>}
            <label className="check-field"><input name="available" type="checkbox" defaultChecked={editing.available} /> Post this meal now</label>
            {formError && <p className="login-error" role="alert">{formError}</p>}
            <button className="save-button" type="submit" disabled={saving}>{saving ? "Uploading & saving..." : "Save meal"}</button>
          </form>}
        </section>
      </div>}
    </main>
  );
}
