# 360° Panorama Metadata Generator

A browser-based tool for setting orientation, GPS, and timestamp metadata on
equirectangular 360° panorama images. It generates a ready-to-run `exiftool`
command - no server, no upload, everything stays local.

---

## Requirements

- A modern browser (Chrome, Safari, Firefox)
- [`exiftool`](https://exiftool.org) installed and available in your `PATH`

Open `360PanoMeta.html` directly from the filesystem - no web server needed.

---

## Usage

1. **Drop or browse** an equirectangular panorama (JPEG, PNG, or TIFF; must be exactly 2:1 aspect ratio, e.g. 8192×4096).
2. The image loads into a Pannellum 360° viewer. Any existing XMP-GPano, GPS, and date metadata is read automatically.
3. Use the controls on the right to adjust orientation, location, and timestamp.
4. **Copy** the generated `exiftool` command and run it in a terminal to write the metadata back to the file.

---

## Controls

### Viewer panel

| Control            | What it does                                                                                                                 |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| **Set North**      | Marks the current view direction as geographic North. Point at a known landmark or compass reference, then click.            |
| **Set Start View** | Captures the current pan/tilt as the initial view direction that 360 platforms (Facebook, Google Photos, etc.) will open to. |
| **Grid**           | Toggles a centre-crosshair overlay to help align the horizon.                                                                |

### Orientation

| Control                      | XMP-GPano tag written                                                    |
| ---------------------------- | ------------------------------------------------------------------------ |
| Heading - viewer navigation  | *(view only - used to aim the Straighten slider; not written to EXIF)*   |
| Straighten - PoseRollDegrees | `PoseRollDegrees` + `PosePitchDegrees` (decomposed by heading direction) |
| Initial FOV                  | `InitialHorizontalFOVDegrees`                                            |

> **Straighten tip:** Navigate to a heading where the horizon is clearly
> visible, then drag the slider until it's level. Repeat from a perpendicular
> heading to fine-tune the pitch component.

### GPS Location

Search by place name, decimal coordinates (`37.7749, -122.4194`), or DMS
(`14°33'44.7"N 90°31'20.9"W`). Click or drag the map marker to fine-tune.
Latitude and longitude fields are also directly editable.

### Date & Time

| Field                 | Description                                                                                                                                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Detect from image** | Reads the capture time from the filename (if it matches `IMG_YYYYMMDD_HHMMSS_…` or `YYYY-MM-DD HH.MM.SS IMG_###`) or falls back to EXIF `DateTimeOriginal` → `CreateDate` → `ModifyDate`. Timezone is pre-filled from your system clock. |
| Date & Time           | `datetime-local` picker - editable to the second.                                                                                                                                                       |
| Timezone              | UTC offset in `±HH:MM` format (e.g. `-06:00`, `+05:30`).                                                                                                                                                |

When set, the command writes all standard date fields: `DateTimeOriginal`,
`CreateDate`, `FileModifyDate`, `ModifyDate`, `OffsetTime*`,
`IPTC:DigitalCreationDate/Time`, and `XMP:DateCreated`.

---

## Generated command

The tool generates a single `exiftool` shell command that writes:

- All six XMP-GPano orientation tags
- GPS coordinates in DMS format (when set)
- All date/time fields with timezone offset (when set)

Example output:

```sh
exiftool \
  -XMP-GPano:ProjectionType="equirectangular" \
  -XMP-GPano:UsePanoramaViewer=True \
  -XMP-GPano:FullPanoWidthPixels=16384 \
  -XMP-GPano:FullPanoHeightPixels=8192 \
  -XMP-GPano:CroppedAreaImageWidthPixels=16384 \
  -XMP-GPano:CroppedAreaImageHeightPixels=8192 \
  -XMP-GPano:CroppedAreaLeftPixels=0 \
  -XMP-GPano:CroppedAreaTopPixels=0 \
  -XMP-GPano:PoseHeadingDegrees=93.1 \
  -XMP-GPano:PosePitchDegrees=0.8 \
  -XMP-GPano:PoseRollDegrees=0.4 \
  -XMP-GPano:InitialViewHeadingDegrees=0.3 \
  -XMP-GPano:InitialViewPitchDegrees=0 \
  -XMP-GPano:InitialHorizontalFOVDegrees=100 \
  -GPSLatitude="14 33 40.3776" -GPSLatitudeRef=North \
  -GPSLongitude="90 44 5.3628" -GPSLongitudeRef=West \
  -DateTimeOriginal="2026:05:19 11:03:29" \
  -CreateDate="2026:05:19 11:03:29" \
  -FileModifyDate="2026:05:19 11:03:29-06:00" \
  -ModifyDate="2026:05:19 11:03:29" \
  -OffsetTime="-06:00" \
  -OffsetTimeOriginal="-06:00" \
  -OffsetTimeDigitized="-06:00" \
  -IPTC:DigitalCreationDate="2026:05:19" \
  -IPTC:TimeCreated="11:03:29-06:00" \
  -IPTC:DigitalCreationTime="11:03:29-06:00" \
  -XMP:DateCreated="2026:05:19 11:03:29.00-06:00" \
  -overwrite_original \
  "Injected.jpg"
```

## Google Photo Sphere XMP schema

> After thoroughly reading and testing each tag, including translating them
> into other languages and discovering serious wording errors like *"from
> North, for **the** center **the** image"* I decided to add my own wording to
> the [GPano
> specs](https://developers.google.com/streetview/spherical-metadata#gpano_parameter_reference).
> I know these parameters have not been implemented correctly in virtually any
> 360-degree panorama viewer and I guess the issue is the lack of clarity on
> the definitions.
>
> I created a mental model to make the pose tags easier to understand. It
> becomes much clearer once you realize that the point of reference is an
> imaginary sphere stuck to the Earth’s surface, pointing north and perfectly
> leveled with the horizon. Imagine a small sphere (our panorama) attached to a
> much larger sphere (the Earth). This is why the **Z-axis points up**, the
> **X-axis points East**, and the **Y-axis points North**. It also explains why
> the Pose tags move the center of the panorama image relative to this
> imaginary sphere, and why the initial view moves the camera relative to the
> imaginary sphere rather than to the panorama image itself.


* **Virtual sphere:**  
  A 360°×180° imaginary sphere as a placemark/vessel or frame of reference for
  the panorma image, fixed in real-world orientation above earth's surface,
  North = 0°, perfectly level horizon, positioned at the given
  latitude/longitude/altitude (Z=up, X=east, Y=north), Euler angles rotate the
  photo sphere frame into that virtual sphere or frame of reference.

* **GPano:PoseHeadingDegrees:**  
  Compass heading (in degrees) clockwise from North of the virtual sphere to
  the center of the panorama image.  
  **Exiftool argument:** `-XMP-GPano:PoseHeadingDegrees`  
  **Value:** `>= 0 and < 360`  
  **Example:** Set to `270` if the center of the image points East, because
  from the North of the virtual sphere, the image center is `-90°`, but we
  don't have negative numbers in this tag, so from the North clockwise, we have
  to go to `270°` to get to the center of the panorama image.

* **GPano:PosePitchDegrees**  
  Pitch of the center of the image, measured in degrees above the virtual
  sphere’s horizon. Positive = center is above the horizon (looking up),
  Negative = center is below the horizon (looking down).  
  **Exiftool argument:** `-XMP-GPano:PosePitchDegrees`  
  **Value:** `>= -90 and <= 90`  
  **Example:** Set to `-10` if the center of your image shows a point that is `10°` below the virtual sphere horizon.

* **GPano:PoseRollDegrees**  
  Roll of the image, measured in degrees. Level with the virtual sphere horizon
  = 0. As the value increases, the horizon in the image rotates
  counterclockwise.  
  **Exiftool argument:** `-XMP-GPano:PoseRollDegrees`  
  **Value:** `> -180 and <= 180`  
  **Example:** If the horizon in your image is tilted 5° clockwise, set +5 to
  level it, because positive numbers move the panorama image counterclockwise
  in relation to the virtual sphere.

* **GPano:InitialViewHeadingDegrees**  
  Heading of the initial view (what the user sees first), in degrees clockwise
  from virtual sphere North. Not relative to the panorama image center but
  relative to the virtual sphere.  
  **Exiftool argument:** `-XMP-GPano:InitialViewHeadingDegrees`  
  **Value:** `>= 0 and < 360`

* **GPano:InitialViewPitchDegrees**  
  Pitch of the initial view, in degrees above the virtual sphere horizon. Not
  relative to the panorama image center but relative to the virtual sphere.  
  **Exiftool argument:** `-XMP-GPano:InitialViewPitchDegrees`
  **Value:** `>= -90 and <= 90`

* **GPano:InitialViewRollDegrees**.  
  Roll of the initial view. Level with the virtual sphere horizon = 0. As the value increases, the horizon in the view rotates counterclockwise.
  **Exiftool argument:** `-XMP-GPano:InitialViewRollDegrees`  
  **Value:** `> -180 and <= 180`

## To-dos
- Add an extra option to support the broken implementation of Facebook panoramas.
- Handle the `InitialViewPitchDegrees` tag.

## License

MIT License - Copyright © 2026 Rodrigo Polo.