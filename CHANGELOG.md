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

### Fixed

- Fixed word wrapping and alignment issues in the RTK header button.

- When the map view becomes visible, the drones for which we have received a
  telemetry update earlier are added to the map immediately, without waiting for
  the next telemetry update.

- Reloading a show from disk now works again.

## [1.21.0] - 2021-05-10

This is the release that serves as a basis for changelog entries above. Refer
to the commit logs for changes affecting this version and earlier versions.
