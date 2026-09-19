# Asset credits

Every third-party asset shipped in `public/` is listed here with its source and license.
Licenses were checked on the source page at download time (2026-09-19).

## 3D models (`public/models`)

All models were compressed with `@gltf-transform/cli` (meshopt geometry, WebP textures). Geometry is otherwise unchanged; materials are replaced or recolored at runtime in `src/components/three`, and the hero robot mesh is split into head, arm and body parts at runtime so it can be animated in code.

| File | Title | Author | License | Source |
| --- | --- | --- | --- | --- |
| `polybot.glb` | Robot | Polygonal Mind | CC0 1.0 | https://poly.pizza/m/ejDr8lRglP |
| `uno.glb` | Arduino Uno | M Ferrieu | CC BY 3.0 | https://poly.pizza/m/2BEJQybmqQT |
| `board.glb` | Circuit board 1 | Bill Baran (Sirkut) | CC BY 3.0 | https://poly.pizza/m/fxKdRjNq20j |
| `battery.glb` | Battery | Quaternius | CC0 1.0 | https://poly.pizza/m/MYa3uWdwPU |

Procedural (built in code, no external source): cardboard kit box, TT gear motors, wheels, ultrasonic sensor, jumper wires, robot-car chassis.

## Photographs (`public/images`)

Downloaded from Wikimedia Commons at 1920px width.

| File | Author | License | Source |
| --- | --- | --- | --- |
| `arm-lab.jpg` | Shixart1985 | CC BY 2.0 | https://commons.wikimedia.org/wiki/File:Robot_arm_works_on_a_small_component_in_a_lab_setting.jpg |
| `circuit-hands.jpg` | Shixart1985 | CC BY 2.0 | https://commons.wikimedia.org/wiki/File:Holding_a_circuit_board_close_to_electronic_components_in_a_workshop.jpg |
| `mcu-macro.jpg` | Profpcde | CC0 | https://commons.wikimedia.org/wiki/File:Macro_photograph_of_the_RP2350_microcontroller_on_a_Raspberry_Pi_Pico_2_board.jpg |
| `first-crunch.jpg` | Steve Jurvetson | CC BY 2.0 | https://commons.wikimedia.org/wiki/File:The_crunch_begins_to_meet_tonight%27s_FIRST_robotics_competition_deadline_(16538996086).jpg |
| `multimeter.jpg` | Zeroping | CC BY 4.0 | https://commons.wikimedia.org/wiki/File:Multimeter_probes_on_breadboard.jpg |
| `soldering.jpg` | 4300streetcar | CC BY 4.0 | https://commons.wikimedia.org/wiki/File:Pinecil_USB_C_soldering_iron.jpg |
| `printer-farm.jpg` | Majabojarska | CC BY 4.0 | https://commons.wikimedia.org/wiki/File:3D_printer_farm_at_Hackerspace_Wroc%C5%82aw.jpg |

CC BY assets require visible attribution. The site footer renders this same list (from `src/content/site.ts` → `credits`) in an expandable "Asset credits" panel. Keep the two in sync when assets change.
