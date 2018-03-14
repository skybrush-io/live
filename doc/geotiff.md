Loading GeoTIFF layers into the Flockwave GUI
=============================================

:Author: Tamas Nepusz
:Date: 14 March 2018

1. Download [GeoServer](http://geoserver.org/release/stable/); the platform
   independent binary is recommended.

2. Start GeoServer (this is for Linux; Windows instructions are in `RUNNING.txt`
   within the GeoServer distribution):

   ```
   GEOSERVER_HOME=`pwd` bin/startup.sh
   ```

3. Navigate to `http://localhost:8080/geoserver` from a web browser to get to the
   admin interface of the server.

4. Log in to the admin interface with username `admin` and password `geoserver`
   (unless they were changed; in that case, use whatever you changed the admin
   password to).

5. Open the "Layers" menu under the "Data" heading on the sidebar.

6. Remove all layers that were added to GeoServer by default for demo purposes.

7. Open the "Stores" menu under the "Data" heading on the sidebar.

8. Remove all data sources that were added to GeoServer by default for demo
   purposes.

9. Open the "Workspaces" menu under the "Data" heading on the sidebar.

10. Remove all workspaces that were added to GeoServer by default for demo
    purposes.

11. Click on "Add new workspace" and create a workspace named `collmot`. Specify
    `http://ns.collmot.com/2018` as the namespace URI (the exact value does not
	matter). Make it the default workspace.

12. Go back to the "Stores" menu under the "Data" heading on the sidebar.

13. Click on "Add new Store", and select "GeoTIFF" within the "Raster Data Sources"
    section.

14. Select `collmot` as the workspace. Enter a short, descriptive lowercase name
    in `Data Source Name` (e.g., `mylayer`). Enter `file:` followed by a relative
	or absolute path to the GeoTIFF file in the URL field. (When using a relative
	path, it will be relative to the GeoServer data directory). An example GeoTIFF
	file to test things with is to be found [here](http://www.terracolor.net/download/tc_ng_oslo_no_geotiff.zip).
	You may also click on the "Browse..." button, which will let you browse the
	GeoServer data directory.

15. Once the source is added, GeoServer will show you the "New Layer" screen that
    allows you to create a layer to show the GeoTIFF file. Click on "Publish"
	to do so.

16. After clicking the "Publish" button, GeoServer might ask you to
    specify the coordinate reference systems. There are two coordinate reference
	systems to declare: the *native* one and the *declared* one. I have no idea
	what the difference is between the two; for the GeoTIFF file that I have
	tried (see the example above), both were set to EPSG:3857, which is the
	Web Mercator (WGS84) projection.

17. Set a name for the layer; the full name of the layer will be the name of the
    workspace (e.g., `collmot`), a colon and the name of the layer. For instance,
	if the name of the layer is `oslo`, the full name will be `collmot:oslo`.

18. Go to the "Layer Preview" menu on the sidebar, select the layer that we have
    just created and pick "OpenLayers" in the "All Formats" dropdown box. A new
	window should appear, showing the imported GeoTIFF layer.

19. In Flockwave, create a new "Tile Server" layer, set the tile server type to
    "WMS", and set the tile server URL to `http://localhost:8080/geoserver/wms`.
	In the "Layers" text field, enter the name of the layer that you have just
	created (e.g., `collmot:oslo`), and press "Save settings". If you did
	everything correctly, the imported GeoTIFF file should now be shown in the
	Flockwave window.
