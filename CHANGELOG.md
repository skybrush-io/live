# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- The header now includes a button for audible notifications when a UAV goes
  into an error state. Clicking on the button while the alert is active will
  dismiss the alert; clicking it again will disable the audible notification.

- Clicking on a row in the popover of the UAV status summary header widget now
  selects all UAVs corresponding to the given row.

- Each row of the UAV status summary header widget now shows a counter with the
  exact number of UAVs corresponding to that row.

- The RTK status widget now shows a summary describing how many UAVs are in a
  given GPS fix state; this can be used to validate whether all UAVs are
  receiving RTK corrections.

- The weather info widget now shows the current planetary K index estimate if
  the server provides this information.

- Added a button in the toolbar of the 3D view that rotates the camera towards
  the center of the drone swarm.

- Added a new Beacons panel and a Beacons layer to the map view; this layer
  can show the beacons or points of interests configured in the server. For
  Skybrush server 1.27.0 and later, this layer will also show the position of
  the RTK base station if a base station was selected in Live.

### Changed

- UAV status summary header widget is now sorted by the severity of the items,
  in decreasing order.

- Distances in the hover tooltip of the map are now shown in kilometers, meters
  or centimeters, depending on their magnitude.

### Fixed

- Removing a UAV with the trashcan icon from the UAV list now also removes it
  from the map.

- Fixed a bug in the UAV selection using drag boxes when the map view was rotated.

## [1.24.3] - 2021-09-03

### Added

- Added a header widget that shows the time of the next sunrise or sunset; useful
  for conducting test flights on airfields that are closed to air traffic after
  sunset until the next sunrise.

## [1.24.0] - 2021-08-13

### Added

- Added a color input text field (in hex notation) under the color picker in the
  Light control panel.

- You can now move faster in the 3D view by pressing Shift.

### Changed

- The default filename for an exported mapping file now includes the show filename
  and the time when it was saved.

### Fixed

- Keyboard navigation no longer interferes with the controls of the 3D view.

- When viewing an indoor show, a single square on the floor texture now represents
  1 meter instead of 20 meters.

- Drones marked as "gone" in the UAV list are now considered "missing" in the
  "Setup takeoff area" dialog. Before this fix, only drones that were never seen
  or were explicitly removed from Skybrush Live were considered missing.

- Fixed a bug that prevented the system from recording two saved locations with
  the same name.

## [1.23.0] - 2021-07-19

### Added

- `Ctrl-S` (or `Cmd-S` on macOS) can now be used to toggle whether the UAV
  list should be sorted by IDs or mission IDs.

- UAVs can now be selected by typing its ID or mission ID and then pressing
  Enter.

- UAV lights can now be flashed by typing the ID or mission ID of the UAV and
  then pressing `W`.

- The mapping from mission IDs to UAV IDs can now be exported into a simple text
  file and it can also be read back later.

- You can now change the type of the altitude displayed in the altitude summary
  header widget from AMSL to AGL or local Z coordinate by clicking on the
  widget itself.

- When testing a large show with only a few drones, you can now choose to hide
  the empty (unassigned) slots from the UAV list to make the list shorter.

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
