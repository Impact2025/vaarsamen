// ─── NWD SEED DATA ───────────────────────────────────────────────────────────────
// Vaardigheden per boottype (NWD curriculum)

export const NWD_SKILLS = [
  // Valk vaardigheden (NWD Basis)
  { bootType: 'valk', code: 'V-01', naam: 'Onderzeeër zeilen - basis' },
  { bootType: 'valk', code: 'V-02', naam: 'Onderzeeër zeilen - onderwijs' },
  { bootType: 'valk', code: 'V-03', naam: 'Gaande wind optimally' },
  { bootType: 'valk', code: 'V-04', naam: 'Holle wind optimally' },
  { bootType: 'valk', code: 'V-05', naam: 'Drijvende dock stijgplaats' },

  // Polyvalk vaardigheden
  { bootType: 'polyvalk', code: 'PV-01', naam: 'Gaande wind optimally (2-3 pax)' },
  { bootType: 'polyvalk', code: 'PV-02', naam: 'Holle wind optimally (2-3 pax)' },
  { bootType: 'polyvalk', code: 'PV-03', naam: 'Drijvende dock stijgplaats' },
  { bootType: 'polyvalk', code: 'PV-04', naam: 'Manuele ankeropruimiging' },

  // Laser vaardigheden
  { bootType: 'laser', code: 'L-01', naam: 'Rolmanoeuvreert met board' },
  { bootType: 'laser', code: 'L-02', naam: 'Superschip achteruit' },
  { bootType: 'laser', code: 'L-03', naam: 'Kwikstijg onder spinnaker' },

  // RS Feva vaardigheden
  { bootType: 'rs_feva', code: 'F-01', naam: 'Trap manoeuvreert' },
  { bootType: 'rs_feva', code: 'F-02', naam: 'Trap inschieten' },
  { bootType: 'rs_feva', code: 'F-03', naam: 'Coaching vaardigheden' },

  // Kajuitjacht vaardigheden
  { bootType: 'kajuitjacht', code: 'KJ-01', naam: 'Motorbediening basis' },
  { bootType: 'kajuitjacht', code: 'KJ-02', naam: 'Ankeren met motor' },
  { bootType: 'kajuitjacht', code: 'KJ-03', naam: 'Docking met stroom' },
  { bootType: 'kajuitjacht', code: 'KJ-04', naam: 'Navigatie GPS' },
  { bootType: 'kajuitjacht', code: 'KJ-05', naam: 'VHF gebruik' },

  // Catamaran vaardigheden
  { bootType: 'catamaran', code: 'C-01', naam: 'Trap starten' },
  { bootType: 'catamaran', code: 'C-02', naam: 'Trap afsteken onder volle stoom' },
  { bootType: 'catamaran', code: 'C-03', naam: 'Knickscheidingen' },
] as const