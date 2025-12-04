# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [main]

### Added

- Added estimated completion time for the upload dialogs.

- Parameters are now uploaded with a more efficient bulk upload protocol if the
  server supports it (requires a server with version 2.34.1 or later).

- The show adaptation dialog now allows you to specify the desired duration of
  the transition from takeoff to the first formation of the show.

- Upload dialogs can now be restricted to only showing and acting on the global
  drone selection. The feature works in combination with the drone selection
  hotkeys.

- Added a compass calibration operation to the UAVs panel.

- Added a slider to the properties of the UAV layer that can be used to change
  the size of the UAV icons on the layer. Useful when flying larger fleets and
  the UAVs are placed very close to each other in the takeoff grid.

- Added Polish translation, thanks to our translator community!

- Updated Chinese translation, thanks to our translator community!

### Changed

- Show files are now parsed and loaded in a separate worker thread so the
  loading process does not block the UI any more.

- The coordinate system of a show is now fitted on a separate worker thread so
  the calculation does not block the UI any more.

- Optimized the calculation of the minimum distance between takeoff and landing
  positions, shaving off several seconds from the time needed to load a show with
  several thousands of drones.

### Fixed

- Fixed a bug in the Google Maps layer (used only in special configurations)
  where the terrain disappeared when zooming in too close.

## [2.11.0] - 2025-07-23

### Added

- Added support for testing pyro triggering. It can be reached from the
  Tests tab of the Properties dialog. Requires Skybrush Server 2.28.0 or higher
  and compatible ArduCopter firmware (CMCopter-4.6 branch or higher).

- Drone selection with typing its physical ID or show ID and pressing Enter got
  extended to work for ranges of IDs as well. Ranges of UAVs can now be selected
  with typing e.g. 100-200 (which will select drones with physical ID between
  100 and 200, including both ends).

- You can now select missing, misplaced or misaligned drones in the Takeoff
  Area Setup dialog with the proper "Select all" buttons on the right of each row

### Fixed

- More robust reconnection logic for TCP connections to a server. The connection
  indicator in the header should not go out of sync with the actual connection
  attempts any more.

- Fixed convex geofence generation for cases where intermediate segments of
  Bézier curves extended outside the convex hull defined by their endpoints
  (from now on Bézier control points are also included in the calculation).

## [2.10.0] - 2025-06-03

### Changed

- Updated `aframe-component-environment` dependency to version 1.4.0

## [2.9.1] - 2025-06-02

### Added

- The show adaptation tool has been added to Live, with which one can reconfigure
  the show layout (takeoff positions and net show positions, independently) on the
  spot, without the need for involving show designers into the process.

- The minimum allowed distance between takeoff and landing positions in a
  show file can now be adjusted from the settings.

- Added `C` as a hotkey for toggling between sending commands via the primary
  or the secondary channel if the server is configured to use two channels.

- The "Connection" icon in the header now shows whether the communication
  with the drones happens on the primary or the secondary channel.

### Changed

- The primary hotkey of the "Toggle broadcast mode" button is now `B` instead
  of `Ctrl-B` or `Cmd-B`. The old hotkeys will keep on working nevertheless
  so you do not need to re-train your muscle memory.

## [2.9.0] - 2025-04-07

### Added

- Added the total number of UAVs in the UAV status summary header widget.

- Added a new panel for monitoring and controlling one specific drone and its
  devices.

- The RTK corrections dialog now shows which of the RTK messages are being
  forwarded to the drones, assuming that the server sends this information.

- Show start can now be authorized automatically when setting the start time.

- The UAV list and the UAV details dialog now show the RSSI (signal strength) of
  each drone if the server provides this information. Thanks to @mwls-sean for
  implementing the first version of this feature!

- The UAV list can now be filtered to show drones in low-power mode only.

- When loading a show, we now validate the minimum distance between takeoff
  positions and the minimum distance between landing positions. An error will
  be shown if any pair of takeoff positions or any pair of landing positions are
  too close to each other.

- The minimum distance between takeoff positions is now shown in the button
  that is used to load a show so you can quickly see what the spacing of the
  takeoff grid is (assuming uniform spacing).

- Make the "Flash lights" button latchable by holding Shift while activating it.

- Implemented range selection in list views. Click on one item and then hold
  Shift while clicking on another one to select everything between them.

- Maximum number of concurrent show upload tasks can now be changed from the
  settings.

- Made it possible to import geospatial information from shapefiles.

- Enabled over-the-air firmware updates. (Requires compatible / supported UAVs.)

- Added new header widgets for displaying summarized distance and velocity data.

- Added a new panel for displaying detailed information about a single UAV.
  (Similarly to the UAV details dialog, but docked on the layout.)

- Added a component for visualizing measurement values from rangefinder sensors.

- Introduced support for multiple UI languages via community translations.

### Changed

- When setting the start time based on a time offset from the current time,
  the offset is now taken into account when the "Set start time" button is
  pressed. For instance, selecting "+30s" in the suggestions box will now
  start the show 30 seconds after the time when the "Set start time" button
  was pressed, not 30 seconds after the time when the "+30s" button was
  pressed.

- Filtering for drones with "No telemetry" now also includes drones in the
  "GONE" state.

- The width of the show upload dialog is now tailored towards larger shows
  as it now includes 20 drones per row.

- The labeling and styling of certain special features are now based on
  automatic suggestions unless manually overridden by the user.

- Improved the log download workflow and user experience.

### Fixed

- Fixed an issue with degenerate geofences consisting of one or two points only.

- Fixed a bug in handling `UAV-SLEEP` messages targeting multiple drones.

- Fixed a bug in the automatic coordinate system fitting algorithm when some
  UAVs did not have a GPS fix yet.

- The rotation interaction now performs transformations predictably and
  consistently when multiple features are selected.

- Eliminated performance issues with the map and UAV list views that caused
  sluggish framerates in certain conditions with several hundred active drones.

### Miscellaneous

- Performance optimizations.

## [2.8.0] - 2023-10-30

### Added

- Added a new "Field notes" panel to the sidebar that can be used to jot down
  quick notes without having to leave Skybrush Live.

- Added a way to switch the selected UAV in the UAV Details Dialog by clicking
  the avatar at the top of the sidebar.

- Drawing operations can now be aborted with the `Escape` button.

- Desired takeoff headings for the UAVs before a show can now be different from
  the orientation of the X axis during a show, allowing for more flexibility in
  the placement of the GCS and the operator when preparing for a show.

- The UAV details panel now has a "Logs" tab that you can use to download log
  files from the UAV if the server knows how to fetch the logs.

### Changed

- The `Delete` hotkey now removes the selected features as well.

### Fixed

- Fixed minor issues with scrolling the Field notes panel; the size of the panel
  was slightly larger than its container so the last line was not visible at the
  bottom of the panel. This is working correctly now.

## [2.7.2] - 2023-04-22

### Fixed

- Fixed an issue with the "Onboard preflight checks" dialog that resulted in
  drones in the "On ground with motors off" state appeared incorrectly in the
  error list.

## [2.7.1] - 2023-04-21

### Added

- Enable multi-window support by making panels detachable from the main layout.

- Static image layer with adjustable latitude, longitude, heading and scaling.

- You can now cut holes into polygons and add a label that measures the area of
  the polygon.

- Error messages provided by the server during a failed upload are now shown in
  tooltips when hovering over the corresponding upload status pill of the UAV
  in the upload dialog.

- UAVs now support the new "sleep state" status code introduced in Skybrush
  Server 2.10.0.

- Support for handling true AGL (_Above Ground Level_) data.

- Added support for accelerometer calibration from the UI if the server also
  supports this operation for the particular UAV type.

- Added a new clock in the Clocks panel that shows the number of seconds
  until the end of the current show being managed by Live. This clock appears
  only if the server is updated to version 2.12.1 or later.

- The version number of the server is now shown in the popover of the
  connection widget in the header.

### Changed

- The Electron based packaged version now uses a TCP socket to communicate
  with the server instead of the WebSocket connection used in the browser.

- The `INACTIVE` warning in the UAV list or grid view has been renamed to
  `NO TELEM` to make it clear that this status means that we have not received
  telemetry data from the UAV for a while.

- Motor tests now require confirmation on the user interface.

### Fixed

- Fixed some cases in which the pending UAV ID overlay could remain on the
  screen without timing out.

- Corrected the previously misnamed occurrences of AGL to AHL.
  (_Above Ground Level_ -> _Above Home Level_)

## [2.6.0] - 2022-10-20

### Added

- UAV trajectories shown on the map now have arrowheads at the start and end
  coordinates.

### Fixed

- Empty mission slots can now be selected and the map view will show the
  corresponding trajectory even if no drone is assigned to the slot yet.

## [2.5.0] - 2022-09-05

### Added

- During the show upload process, you can now flash the LED lights of the
  drones automatically upon an upload failure. This feature, combined with
  the automatic retry feature, is helpful in identifying drones on the field
  that are struggling with the show upload due to poor wifi reception.

### Changed

- The maximum zoom level of the map view is now limited to zoom level 24 to
  prevent the app from zooming in way too closely to a single drone when the
  "Fit to drones" button is pressed with a single drone only.

- Implemented several tweaks to the automatic show coordinate system fitting
  algorithm to make it work better in real situations on the field.

- The "Clear current fence" button in the "Setup geofence" dialog now also
  removes the fence polygon from the map instead of simply converting it to
  an ordinary polygon.

- The broadcast switch was moved from the UAV toolbar to the header and now it
  can also be triggered with a hotkey (Ctrl-B on Windows and Linux, Cmd-B on
  macOS).

- The graticule layer (the latitude-longitude grid overlaid on top of the map)
  now adjusts itself to the preferred coordinate format; in other words, if
  Skybrush is configured to show latitudes and longitudes using degrees,
  minutes and seconds, then the graticule itself will also try to ensure that
  the lines align with whole degrees, minutes and seconds.

### Fixed

- Fixed a bug where the RTK correction message age counters were not updated
  correctly.

## [2.4.1] - 2022-07-30

### Fixed

- Fixed incorrect validation of the longitude field in the location editor
  dialog box.

- Show file change detection (only available in the desktop version) now works
  even while the _"Show control"_ panel is not active.

## [2.4.0] - 2022-07-21

### Added

- The contrast of the LCD clocks can now be enhanced in dark mode by hiding the
  inactive segments.

- Experimental: the show coordinate system can now be fitted automatically to
  the current positions of the drones, i.e. there is no need to align the
  takeoff positions of the drones with the current positions before takeoff.
  The feature is experimental because we did not test all corner cases yet, but
  it should behave correctly for everyday cases when most of the drones are
  laid out on the launch pad according to the takeoff formation.

### Changed

- When rotating the convex hull of the show using mouse gestures, the origin of
  the rotation is now the center of the takeoff area instead of the center of
  the entire convex hull.

### Fixed

- Fixed a crash of the weather widget in the header when the map was scrolled
  to a coordinate with no sunrise and no sunset on the current day.

- The UAV list now remembers its scroll position when switching to/from the
  mapping editor mode.

## [2.3.0] - 2022-06-26

### Added

- Start time of the show can now be specified in terms of a MIDI timecode if
  the server supports MIDI clocks. (Pro edition only).

### Fixed

- Fixed enforced limits on the maximum allowed size of a parameter file being
  uploaded to multiple drones. Before this fix, a dialog box was displayed with
  a warning if the size was over the limit, but the app still attempted to
  process the file.

## [2.2.0] - 2022-06-09

### Added

- The Messages panel in the UAV details dialog now shows timestamps for
  incoming messages. In order not to clutter the display, timestamps are shown
  only for the first entry and any entry where the minute of the timestamp is
  different from the previous one.

- You can now provide your own API keys to access Mapbox and Maptiler tile
  services. In the absence of an API key, Skybrush Live falls back to using an
  API key that is shared between all users of Skybrush Live. No guarantees are
  made regarding the availability of map tiles with the shared API keys, so you
  are advised to register your own API key to ensure access to map tiles from
  these providers.

- Skybrush Server users with the offline maps extension can now benefit from
  server-side cached map tiles, which are extremely useful when you are running
  field tests without Internet access. All it takes is to load the map of the
  test area from Skybrush Live with the cache enabled and zooming in and out a
  bit to cover all zoom levels; the server will then remember the downloaded
  tiles and serve them to you even if you have no Internet access. Note that
  the server-side caching is not available in the community edition of the
  server; you will need one of the premium editions.

### Fixed

- The orientation of the show can now be adjusted by rotating the convex hull of
  the show on the map view. To rotate the convex hull, select it, hold down the
  Alt key (Option on macOS), press the mouse button and drag the mouse.
  Before this fix, moving the convex hull worked but it was unresponsive to
  rotations. The rotation gesture is also more intuitive now.

## [2.1.0] - 2022-05-27

### Added

- Added buttons in the UAV toolbar for remote power-on and sleep commands for
  UAVs that support it. Contact us if you would like to add support for your
  drone.

- Added a broadcast switch to the UAV toolbar. Toggling the switch will
  broadcast commands to all UAVs for the next five seconds before returning to
  normal mode. This is useful for waking up an entire drone swarm with
  broadcast power-on commands.

- The preferred geofence action can now be configured in the "Setup geofence"
  dialog box.

## [2.0.0] - 2022-05-02

The source code of Skybrush Live is now licensed under the GNU General Public
License, version 3 or later. You can find the source code on our Github account
at <https://github.com/skybrush-io>

The version number was bumped to 2.0.0 to clearly indicate which versions are
licensed under the GNU GPLv3. There are no breaking changes in this version.

### Added

- The light control panel now contains buttons for setting the LED lights of
  the drones to 25% or 50% of full brightness.

- Added handling of new warning code in server that is emitted when a UAV is
  outside the geofence while on the ground.

### Changed

- The application is now licensed as GNU GPL v3 or later.

### Fixed

- Fixed a crash that happened when adding a UAV trace layer to the map.

- The state of the "Retry failed uploads" checkbox is now saved properly again
  when the application exits.

- Fixed the termination of the server process on macOS when the server is
  launched automatically by Skybrush Live.

- Fixed a bug that sometimes prevented workbench panels from being rendered
  correctly when they were freshly dragged off from the sidebar.

## [1.27.2] - 2021-03-23

### Fixed

- Fixed a rare crash that happened when selecting a group of UAVs with the popup
  of the status summary widget if the group has just become empty in the previous
  frame.

- UAVs marked as gone are now updated on the map correctly when the UAVs layer
  is removed and then re-added.

## [1.27.1] - 2021-03-16

### Fixed

- OpenStreetMap tiles are now pulled from our own servers to ease the load on
  the OpenStreetMap tile servers.

## [1.27.0] - 2021-03-14

### Added

- Parameters can now be imported from a Mission Planner compatible parameters
  file in the parameter upload dialog.

- The map and the 3D views now show a tooltip with the most important information
  about the status of a UAV when hovering over one of them.

- UAVs on the map view now show a yellow or red dot if they are in a warning or
  error state.

- Double-clicking on a UAV now opens the UAV details dialog.

- Added a new graticule layer type that shows a latitude-longitude grid on top
  of the map. The new layer is added automatically after a fresh install; for
  existing installations, you need to add it manually in the Layers panel.
  Typically, the graticule layer should be placed above the base map layer but
  below everything else.

### Fixed

- Fixed a bug that sometimes prevented the map origin from being moved by
  dragging it on the map (only when the Y axis was dragged).

## [1.26.0] - 2021-01-19

### Added

- Parameters can now be uploaded to multiple drones at the same time with a
  dedicated parameter upload dialog.

- Added filter that shows inactive drones only.

- The UAV list view can now also be sorted by clicking on the column headers.

## [1.25.0] - 2021-12-29

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
  the server provides this information. The widget also shows a warning badge
  if the planetary K index is high.

- The weather info widget also shows the magnetic declination according to the
  IGRF13 model at the location where the map is focused at.

- Added a button in the toolbar of the 3D view that rotates the camera towards
  the center of the drone swarm.

- Added a new Beacons panel and a Beacons layer to the map view; this layer
  can show the beacons or points of interests configured in the server. For
  Skybrush server 1.27.0 and later, this layer will also show the position of
  the RTK base station if a base station was selected in Live.

- UAV lists are now sortable and filterable based on various criteria.

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
