# v2 music and sound

## The song
The client chose **Kanye West feat. Pusha T, "Runaway"** and supplied an MP3 (160 kbps, 5:39 edit). The client is responsible for licensing it.

None of the following is committed (see `.gitignore`):
- the song itself;
- its separated stems;
- the edited music (`audio/out/music2.wav`);
- the final mix (`audio/out/mix2.wav`).

What is committed:
- the measured grid (`audio/song_grid.json`);
- the edit decision list (`audio/edl_runaway.json`);
- the tools (`audio/edit_song.py`, `audio/sfx2.py`, `audio/mix2.py`).

Re-running needs `audio/in/runaway.mp3`.

## Measured grid
- **Global fit** of onset envelopes across five sections of the track (piano intro, groove, verse, bridge, outro):
  - 87.00 BPM;
  - one beat = 0.689665 s;
  - beat 0 at 0.004 s;
  - all sections agree within 4 ms.
- **Downbeats:** the drum entrance is beat 31, so bars start at k ≡ 3 (mod 4).
- **The riff:** solo piano, one note every two beats:

  | Group | Notes |
  |---|---|
  | E | E6 k0 · E6 k2 · E6 k4 · E5 k6 |
  | D♯ | D♯6 k8 · k10 · k12 · D♯5 k14 |
  | C♯ | C♯6 k16 · k18 · k20 · C♯5 k22 |
  | Turnaround | A5 k24 · A5 k26 · G♯5 k28 · E6 k30 (pickup) |

- **The drop:** k31, at 21.38 s.
- **Lyrics:** mapped with Whisper (word timestamps) and confirmed with Demucs (`htdemucs_ft`) vocal stems.
  - The first lyric is at 45.16 s, so k0–64 is fully instrumental.
  - The outro k449–478 is instrumental (vocoder / synth in the "other" stem).
  - The song ends with the band stopping at k479, then the riff's first four notes alone (E6 k480/482/484, E5 k486).

## The edit (output beats → source)

| ob | Source | Picture |
|---|---|---|
| 0–8 | k0–8: the riff's E group (lightly filtered, 0.75 width: "heard through glass") | Launching a coin · the coin exists · "Then it goes quiet." on the low E5 |
| 8–10 | **Digital silence** | Absence; the first volt pixel |
| 10–25 | k16–31: the riff resumes at C♯6 (the D♯ group is cut; E→C♯m is I→vi). Each note is one story beat. | Voice appears · One coin. One X Manager. · brain · character · boundaries · budget · launch (G♯5) · ignition (E6 pickup) |
| **25** | **k31: the drop** | **The manager wakes: the slats open** |
| 25–38 | k31–44: clean groove (no lyrics) | Habits |
| 38 | k44: low-pass closes over one beat | It chooses not to act |
| 39 | **Digital silence** | — |
| 40 | k480: the lone E6 from the song's real ending | "Now quiet is a choice." |
| 41–49 | k447–455: the vocoder outro, from Demucs stems minus vocals (removes the tail of the last hook word) | **Payoff** · window → logo · tryvoice.fun · @tryvoice |
| 49–52 | k486: the song's last note (E5 + E6), ringing out | End card |

**Total:** 52 beats = 35.87 s.

**Splice method:** splices start 12 ms before the incoming beat with a 10 ms equal-power crossfade. Checks:
- **Clean attacks:** the incoming transient is untouched, and the outgoing audio is gone before its own next transient.
- **No clicks:** high-frequency peaks fall 8–28 ms *after* each splice (the musical attack), never at the splice itself.

## Sound design (`audio/sfx2.py`)
- **Placement:** every sound is placed from `timeline2.json` (68 sounds, 31 kinds) and tuned to E major:
  - the filament tink is E7;
  - the publish glock is B6 → E7;
  - the slat strums are an Emaj9 arpeggio;
  - the trend stab, F4 + C5, is the only out-of-key sound.
- **Levelling:** each sound sits a set number of dB under the music's local peak (±0.75 s). It therefore follows the song's dynamics, as a sound designer would balance against a finished record. Sounds inside the composed silences use absolute levels.
- **Space:** one shared small room (RT60 0.45 s) for every SFX; far sounds get a wetter send.
- **Sources (all CC0):**
  - Versilian Studios **VSCO-2 Community Edition**: concert bass drum, triangle, glockenspiel, marimba, timpani.
  - **Dirt-Samples** (tidalcycles): TR-909 rim and clap; DR-55 and brush kits.
  - Karplus–Strong models for the slat strums.

## Master (`audio/mix2.py`)
- **Phone lift:** +4 dB on everything before the drop, so the piano reads on phone speakers. The drop still lands about 12 dB harder.
- **Loudness:** BS.1770 integrated **−14.0 LUFS**. A 4× oversampled lookahead limiter holds the true peak **≤ −1 dBTP** (measured −1.54 dBTP).
- **Silences:** both composed silences are exact digital zero.
- **Format:** 48 kHz, 24-bit.
