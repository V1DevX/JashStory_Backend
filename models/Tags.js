const mongoose = require("mongoose");

// ─── Sub-schemas ──────────────────────────────────────────────────────────────

/**
 * Historical date / period.
 * Year convention: negative = BC  (e.g. -44 = 44 BC), positive = AD.
 *
 * Granularity options (use what fits):
 *   - Exact date:  startYear + startMonth + startDay
 *   - Year only:   startYear
 *   - Range:       startYear + endYear
 *   - Century:     century  (-5 = "5th century BC", 19 = "19th century AD")
 *   - Label only:  label.en / label.ru / label.kg  (free-form text)
 */
const periodSchema = new mongoose.Schema(
  {
    startYear:  { type: Number, default: null }, // -3000 … 2025
    startMonth: { type: Number, min: 1, max: 12, default: null },
    startDay:   { type: Number, min: 1, max: 31, default: null },

    endYear:    { type: Number, default: null },
    endMonth:   { type: Number, min: 1, max: 12, default: null },
    endDay:     { type: Number, min: 1, max: 31, default: null },

    century:       { type: Number, default: null },
    isApproximate: { type: Boolean, default: false },

    // Human-readable label, e.g. "circa 3rd century BC" / "около III в. до н.э."
    label: {
      en: { type: String, default: null },
      ru: { type: String, default: null },
      kg: { type: String, default: null },
    },
  },
  { _id: false }
);

/**
 * Geographic location.
 *   historical — name as known at that time  (e.g. "Mesopotamia", "Gaul")
 *   modern     — present-day country / region (e.g. "Iraq", "France")
 *   countryCode— ISO 3166-1 alpha-2 for filtering / grouping  (e.g. "EG")
 *   coordinates— optional WGS84 pin for a map
 */
const locationSchema = new mongoose.Schema(
  {
    historical: {
      en: { type: String, default: null },
      ru: { type: String, default: null },
      kg: { type: String, default: null },
    },
    modern: {
      en: { type: String, default: null },
      ru: { type: String, default: null },
      kg: { type: String, default: null },
    },
    countryCode: { type: String, uppercase: true, maxlength: 3, default: null },
    coordinates: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
  },
  { _id: false }
);

/**
 * One auto-generated translation entry.
 * Stored in the `translations` Map, keyed by ISO 639-1 language code.
 * e.g.  tag.translations.get("zh") → { text: "凯撒大帝", generatedAt, model }
 */
const translationEntrySchema = new mongoose.Schema(
  {
    text:        { type: String, required: true },
    generatedAt: { type: Date, default: Date.now },
    // Which service / model produced this translation ("deepl", "gpt-4o", etc.)
    model:       { type: String, default: null },
  },
  { _id: false }
);

// ─── Tag ──────────────────────────────────────────────────────────────────────

const tagSchema = new mongoose.Schema(
  {
    // ── Public fields ─────────────────────────────────────────────────────────

    /**
     * Semantic type — drives which fields are relevant and how the tag is displayed.
     *   person  — historical figure  (Caesar, Cleopatra, Genghis Khan)
     *   event   — historical event   (Battle of Marathon, French Revolution)
     *   place   — geographical place (Ancient Rome, Great Wall of China)
     *   era     — historical period  (Bronze Age, Renaissance)
     *   dynasty — ruling dynasty     (Ptolemaic, Han, Ottoman)
     *   concept — idea / phenomenon  (feudalism, democracy)
     */
    type: {
      type: String,
      enum: ["person", "event", "place", "era", "dynasty", "concept"],
      required: true,
      index: true,
    },

    /**
     * Canonical multilingual names — entered manually by admins.
     * These three are always required and are the source for auto-translation.
     */
    name: {
      en: { type: String, required: true },
      ru: { type: String, required: true },
      kg: { type: String, required: true },
    },

    /**
     * Auto-generated translations for additional languages.
     * Key: ISO 639-1 code  ("zh", "de", "fr", "tr", "ar", "es", …)
     * To add a new language just set translations.get("fr") — no schema change needed.
     */
    translations: {
      type: Map,
      of: translationEntrySchema,
      default: {},
    },

    // URL-friendly slug, e.g. "julius-caesar"  (auto-generated or set manually)
    slug: { type: String, unique: true, sparse: true, index: true },

    // Historical date / period  (null for concept-type tags is fine)
    period: { type: periodSchema, default: null },

    // Geographic location  (null for era / concept tags is fine)
    location: { type: locationSchema, default: null },

    status: {
      type: String,
      enum: ["active", "hidden"],
      default: "active",
      index: true,
    },

    // ── Admin-only fields  (strip from public API responses) ─────────────────

    /**
     * Aggregate statistics — update via post-save hooks or background jobs.
     * Never increment manually from API handlers.
     */
    stats: {
      postsCount:    { type: Number, default: 0 }, // posts that carry this tag
      viewsCount:    { type: Number, default: 0 }, // total post views for this tag
      uniqueReaders: { type: Number, default: 0 }, // unique readers (approximated)
    },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Tag", tagSchema);
