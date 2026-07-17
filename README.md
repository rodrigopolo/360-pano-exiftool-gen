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
| Initial View Roll            | `InitialViewRollDegrees`                                                 |

> **Straighten tip:** Navigate to a heading where the horizon is clearly
> visible, then drag the slider until it's level. Repeat from a perpendicular
> heading to fine-tune the pitch component.

### GPS Location

Search by place name, decimal coordinates (`37.7749, -122.4194`), or DMS
(`14°33'44.7"N 90°31'20.9"W`). Click or drag the map marker to fine-tune.
Latitude and longitude fields are also directly editable.

### Date & Time

| Field                 | Description                                                                                                                                                                                                                                                                                                                                                 |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Detect from image** | Reads the capture time from the filename (if it matches `IMG_YYYYMMDD_HHMMSS_…` or `YYYY-MM-DD HH.MM.SS IMG_###`) or falls back to EXIF `DateTimeOriginal` → `CreateDate` → `ModifyDate`. Timezone is pre-filled from the image's own EXIF offset (`OffsetTimeOriginal`/`OffsetTime`/`OffsetTimeDigitized`) when present, otherwise from your system clock. |
| Date & Time           | `datetime-local` picker - editable to the second.                                                                                                                                                                                                                                                                                                           |
| Timezone              | UTC offset in `±HH:MM` format (e.g. `-06:00`, `+05:30`).                                                                                                                                                                                                                                                                                                    |

If no date was auto-detected, manually entering a Date & Time also pre-fills
an empty Timezone field from your system clock, so the generated command
doesn't silently omit the date tags.

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
  -XMP-GPano:PoseHeadingDegrees=90.0 \
  -XMP-GPano:PosePitchDegrees=0.5 \
  -XMP-GPano:PoseRollDegrees=0.5 \
  -XMP-GPano:InitialViewHeadingDegrees=90.0 \
  -XMP-GPano:InitialViewPitchDegrees=0.0 \
  -XMP-GPano:InitialViewRollDegrees=0.0 \
  -XMP-GPano:InitialHorizontalFOVDegrees=120.0 \
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
  "Panorama.jpg"
```

## Target viewer compatibility

Real-world testing across 15 panoramas found that some 360&deg; viewers
mis-render specific GPano Pose/InitialView tags. Two bug shapes were found:

- **Sign-flip** - a viewer applies the tag with the opposite sign of what the
  spec defines. This can be compensated by writing the negated value.
- **Non-linear/broken** - a viewer renders the tag unpredictably (e.g. snaps
  pitch to &plusmn;90&deg; regardless of the value written). No value we
  write can fix this, so the tag is written empty instead, clearing any
  pre-existing value.

| Tag                       | Facebook | Photo Sphere Viewer        | Spherical Viewer      |
| ------------------------- | -------- | -------------------------- | --------------------- |
| PoseHeadingDegrees        | ignored  | inverted (clean sign-flip) | correct               |
| PosePitchDegrees          | ignored  | correct                    | snaps to ±90 (broken) |
| PoseRollDegrees           | ignored  | inverted (clean sign-flip) | ignored               |
| InitialViewHeadingDegrees | correct  | broken, non-linear         | correct               |
| InitialViewPitchDegrees   | correct  | broken, non-linear         | snaps to ±90 (broken) |
| InitialViewRollDegrees    | ignored  | ignored                    | ignored               |

The **Target Viewer** dropdown above the generated command lets you opt into
work-arounds for a specific viewer. The default, **Default (spec-compliant)**,
always writes every tag as-is - choosing a target is a deliberate override,
never the default behavior.

| Tag                         | Facebook | Photo Sphere Viewer   | Spherical Viewer |
| ---------------------------- | -------- | ---------------------- | ------------------ |
| `PoseHeadingDegrees`         | strip    | compensate (inverted)  | write              |
| `PosePitchDegrees`           | strip    | write                  | strip              |
| `PoseRollDegrees`            | strip    | compensate (inverted)  | strip              |
| `InitialViewHeadingDegrees`  | write    | strip                  | write              |
| `InitialViewPitchDegrees`    | write    | strip                  | strip              |
| `InitialViewRollDegrees`     | strip    | strip                  | strip              |

When a tag is stripped or compensated for the chosen target, a warning
appears above the command explaining which tag was affected and why. A
stripped tag is still written to the command, but with an empty value
(`-XMP-GPano:TagName=`), which tells `exiftool` to clear the tag - this
removes any pre-existing value rather than merely leaving it untouched.

> **Known upstream bug:** Photo Sphere Viewer's non-linear handling of
> `InitialViewHeadingDegrees`/`InitialViewPitchDegrees` isn't fully
> understood - it doesn't fail consistently enough to reverse-engineer a
> compensation formula, so both are stripped for that target. Worth filing
> as an issue against PSV separately.

## Google Photo Sphere XMP schema

To check how this project complies with the Google Photo Sphere XMP schema
using sample images, use the images available in this repository, which also
includes a detailed explanation of the schema and how to implement it in any
panorama viewer: https://github.com/rodrigopolo/360GPanoReference

## License

MIT License - Copyright © 2026 Rodrigo Polo.