/**
 * Real-world FaBrary “Copy list” export (Pleiades CC) — used to regression-test parser + import pipeline.
 */
export const PLEIADES_FABRARY_CLIPBOARD = `Name: YMBTTTR COPE Pleiades (Copy)
Hero: Pleiades, Superstar
Format: Classic Constructed

Arena cards
1x Arcane Lantern
1x Arcanite Skullcap
1x Boots to the Boards
1x Fyendal's Spring Tunic
1x Gauntlets of Iron Will
1x Miller's Grindstone
1x Nullrune Boots
1x Nullrune Gloves
1x Rampart of the Ram's Head
1x Sledge of Anvilheim

Deck cards
2x Call for Backup (red)
3x Command and Conquer (red)
1x Fate Foreseen (red)
2x Fiddler's Green (red)
1x Hostile Encroachment (red)
3x In the Palm of Your Hand (red)
2x Oasis Respite (red)
1x Pulverize (red)
2x Shelter from the Storm (red)
3x Sigil of Solace (red)
3x Staunch Response (red)
3x Test of Iron Grip (red)
3x Tough Smashup (red)
2x Clash of Bravado (yellow)
2x Midas Touch (yellow)
1x Remembrance (yellow)
3x Righteous Cleansing (yellow)
3x Tough Smashup (yellow)
2x Amulet of Echoes (blue)
2x By the Book (blue)
3x Cranial Crush (blue)
1x Dig In (blue)
2x Disable (blue)
1x Heart of Fyendal (blue)
3x Macho Grande (blue)
1x Overcrowded (blue)
3x Ripple Away (blue)
2x Standing Ovation (blue)
3x Thunder Quake (blue)
1x To Be Continued... (blue)
3x Tough Smashup (blue)
3x Up on a Pedestal (blue)

Feito com o ❤️ na FaBrary
Veja o deck completo em https://fabrary.net/decks/01KKZ35E5BJR9XK1NWS2N76NWE
`;

/** Expected parsed lines (arena equipment + main-deck rows with pitch). */
export const PLEIADES_EXPECTED_ARENA_LINES = 10;
export const PLEIADES_EXPECTED_DECK_LINES = 32;
