# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Basic keyboard navigation in the UAV list view.

- The UAV list view now shows both the UAV ID and the mission (show) specific ID
  of the UAV all the time.

- The "flash lights" operation has been bound to the `W` hotkey for the selected
  drone.

- Added indicators in the header for showing the accuracy of the RTK survey
  (when reported by the base station) and the number of satellites for which
  RTK correction data is sent to the drones.

- Added a battery status indicator to the header that shows the average and the
  minimum battery voltage of the set of tracked drones.

- Inactive UAVs for which no status information has been received for a while
  can now be removed from the UAVs list by pressing the "Remove" button on the
  UAV toolbar. Pressing the button when nothing is selected will remove all
  UAVs marked as "gone" from the UAV list.

### Changed

- The menu bar is now hidden on Windows and Linux.

- Skybrush Live prevents the system from going to sleep automatically when it is
  connected to a server.

### Fixed

- Fixed word wrapping and alignment issues in the RTK header button.

- When the map view becomes visible, the drones for which we have received a
  telemetry update earlier are added to the map immediately, without waiting for
  the next telemetry update.

- Reloading a show from disk now works again.

## [1.21.0] - 2021-05-10

This is the release that serves as a basis for changelog entries above. Refer
to the commit logs for changes affecting this version and earlier versions.
