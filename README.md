# Saudi Surfers

A Subway Surfers-style endless runner set on an open, palm-lined Riyadh highway. Dodge metro trains and barriers, collect coins, grab power-ups and outrun the Saudi police officer (and his falcon) while the Riyadh skyline goes by: Kingdom Centre, Al Faisaliah, Al Majdoul, KAFD and more.

Built by [Abdullah Sultan](https://www.amsultan.site).

## Play

Open `index.html` in a browser. It is a single self-contained page (three.js r128 loads from cdnjs).

## Controls

| Action | Keyboard | Touch |
| --- | --- | --- |
| Switch lanes | ← → or A D | Swipe, or tap the left/right side |
| Jump | ↑, W or Space | Swipe up |
| Roll | ↓ or S | Swipe down |
| Pause | P or Esc | Pause button |
| Mute | M | Sound button on the title screen |

## Power-ups

- **Magnet** pulls nearby coins in
- **Sneakers** give super jumps (straight onto train roofs)
- **Jetpack** flies over everything along a trail of sky coins
- **2x** doubles your score

Passing a landmark raises your score multiplier by one.

## Project layout

```
index.html        built, playable game
build.sh          bundles src/ into index.html
src/head.html     page markup, HUD and styles
src/js/
  01-util.js        math, geometry merging, toon materials, canvas textures
  02-textures.js    procedural textures (track, trains, facades, signs, landmarks)
  03a-models.js     metro cars, ramps, barriers, coins, pickups
  03b-chars.js      runner, police officer, falcon and their animations
  03c-props.js      road segments, palms, shops, villas, mosques, cars, gantries, bridges
  04-landmarks.js   Riyadh skyscrapers
  05-world.js       scene, lighting, sky and the scrolling world
  06-gen.js         obstacle/coin pattern generator and pools
  07-player.js      physics, collisions, power-ups, chaser and camera
  08-audio.js       synthesized sound effects and music
  09-main.js        game flow, input and HUD
```

Edit files in `src/`, then run `./build.sh` to regenerate `index.html`.
