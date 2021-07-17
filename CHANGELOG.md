# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `Ctrl-S` (or `Cmd-S` on macOS) can now be used to toggle whether the UAV
  list should be sorted by IDs or mission IDs.

- UAVs can now be selected by typing its ID or mission ID and then pressing
  Enter.

- UAV lights can now be flashed by typing the ID or mission ID of the UAV and
  then pressing `W`.

- The mapping from mission IDs to UAV IDs can now be exported into a simple text
  file and it can also be read back later.

### Fixed

- Altitude summary indicator now works for indoor UAVs as well. Note that it is
  not possible to mix indoor with outdoor UAVs; the altitude indicator will
  still show AMSL if there is at least one UAV that provides an AMSL altitude.

## [1.22.0] - 2021-07-12

### Added

- Basic keyboard navigation in the UAV list view.

- The UAV list view now shows both the UAV ID and the mission (show) specific ID
  of the UAV all the time.

- The "Setup environment" button in the "Show control" panel now indicates whether
  an outdoor show will be flown based on AMSL or AGL altitudes.

- The "flash lights" operation has been bound to the `W` hotkey for the selected
  drone.

- Added indicators in the header for showing the accuracy of the RTK survey
  (when reported by the base station) and the number of satellites for which
  RTK correction data is sent to the drones.

- Added a battery status indicator to the header that shows the average and the
  minimum battery voltage of the set of tracked drones.

- Added an altitude summary indicator to the header that shows the maximum and
  the minimum altitude of the set of tracked drones. This is useful to check
  whether the altitudes are consistent before takeoff.

- Inactive UAVs for which no status information has been received for a while
  can now be removed from the UAVs list by pressing the "Remove" button on the
  UAV toolbar. Pressing the button when nothing is selected will remove all
  UAVs marked as "gone" from the UAV list.

### Changed

- Redesigned user interface for the upload dialog, with more detailed status
  information and the ability to (re)start the upload process on any of the
  drones simply by clicking on its indicator in the dialog.

- The menu bar is now hidden on Windows and Linux.

- Skybrush Live prevents the system from going to sleep automatically when it is
  connected to a server.

### Fixed

- Fixed word wrapping and alignment issues in the RTK header button.

- The popup that appears when hovering over the UAV status summary lights in the
  header now distinguishes properly between low battery (yellow LOWBAT) and
  critically low battery (red LOWBAT) conditions.

- When the map view becomes visible, the drones for which we have received a
  telemetry update earlier are added to the map immediately, without waiting for
  the next telemetry update.

- Reloading a show from disk now works again.

## [1.21.0] - 2021-05-10

This is the release that serves as a basis for changelog entries above. Refer
to the commit logs for changes affecting this version and earlier versions.
