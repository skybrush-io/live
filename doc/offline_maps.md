Using an offline map cache with the Flockwave web UI
====================================================

This document explains how to download map data from a WMS (Web Map Service) compliant web server such as OpenStreetMaps to a local cache and then use that local cache while on the field (without Internet access) to show a map layer in the Flockwave web UI.

Preparations
------------

We will use [TileCache](http://tilecache.org/) as a local map tile cache. The idea is that we fire up TileCache, configure it to turn to OpenStreetMaps for the tile data, then point the Flockwave web UI at our local TileCache server, browse around a little bit in the area of interest with multiple zoom levels to get the cache primed with the tiles, and then disconnect from the network. Flockwave will happily keep on using the locally cached tile data.

[TileCache](http://tilecache.org/) is written in Python and it can be run as a standalone server. Installing it should be as easy as running

```sh
$ pip install TileCache
```

It is advised to do this in a dedicated Python virtual environment, e.g., with ``pyenv``:

```sh
$ mkdir tilecache
$ cd tilecache
$ pyenv virtualenv 2.7.10 tilecache-venv-2.7
$ pyenv local tilecache-venv-2.7
$ pip install TileCache
```

TileCache also needs a few extra modules that it does not bring with itself by default:

```sh
$ pip install paste
```

First, we copy the default TileCache configuration file to the current directory:

```sh
$ cp ~/.pyenv/versions/2.7.10/envs/tilecache-venv-2.7/TileCache/tilecache.cfg tilecache.cfg
```

(Replace the path above with the place where ``tilecache.cfg`` was installed within the appropriate Python virtual environment). Next, we create a local folder for storing the cached tiles and update the configuration file to point to this folder:

```sh
$ mkdir tiles
```

Then, edit ``tilecache.cfg`` with your favourite editor and point its ``base`` key within the ``[cache]`` section to the folder that you have just created. Also, edit the ``[basic]`` section at the bottom so it looks like this:

```
[basic]
type=WMS
url=http://129.206.228.72/cached/osm
debug=no
layers=osm_auto:all
extension=png
spherical_mercator=true
```

The above configuration points to the WMS server at ``http://www.osm-wms.de/``. Alternative WMS servers are also
supported, but if you plan to use another one, make sure that the map projection used when constructing the tiles
is the same as the map projection used by Flockwave (i.e. web Mercator).

Finally, we need to start the TileCache server on port 8888 (the default port is not okay because Flockwave runs there):

```sh
$ tilecache_http_server.py -p 8888
```

To test whether TileCache is working properly, open [this URL][1] in a browser. It should display a world map in
a small tile of 256x256 pixels.

  [1]: http://localhost:8888/1.0.0/basic/0/0/0.png

Configuring Flockwave to use TileCache
--------------------------------------

Start the Flockwave web UI and add a new tile server layer to the map.
Set its type to ``TILECACHE``, then set the URL to ``http://localhost:8888``
and the layer name to ``basic``.

Seeding the tile cache before going to the field
------------------------------------------------

Use ``tilecache_seed.py``. First, open the Flockwave web UI and figure out
the boundary box of the area that you wish to download in advance. For
example, the Farkashegy airfield is to be found in the following box:

```
(47.492189, 18.908750) -- (47.479878, 18.924135)
```

Since ``tilecache_seed.py`` needs the coordinates in the projected coordinate
system (i.e. web Mercator in our case, *not* WGS84), we need to convert the
coordinates above from WGS84 to web Mercator. The easiest is probably with
[this online tool](https://mygeodata.cloud/cs2cs/), which gives us:

```
(2104912.42154, 6022785.16782) -- (2106625.0719, 6020757.17834)
```

(Don't forget to tick the *Switch X/Y* checkbox because in WGS84 the
longitude comes first).

``tilecache_seed.py`` also needs the bounding box and the zoom levels of interest.
For the Farkashegy airfield, a zoom level of 16 covers pretty much the
whole airfield on a standard laptop screen and a zoom level of 19 is the
most that you can get out of most tile servers anyway. Therefore, for
practical purposes, it is usually enough to fetch tiles between zoom levels
15 and 19, inclusive. Note that ``tilecache_seed.py`` considers the larger
zoom level as *exclusive* and not inclusive, so if you need everything between
zoom levels 15 and 19, you need to specify 15 and 20:

```sh
$ tilecache_seed.py basic 15 20 -b "2104912.42154,6020757.17834,2106625.0719,6022785.16782" -p 1
```

where the last ``-p 1`` argument denotes that the seeder should fetch one extra
tile around the area of interest in each zoom level.

Cleaning the tile cache
-----------------------

You can use ``tilecache_clean.py`` to keep the cache size at bay. You need
to specify the maximum size of the cache, in megabytes, and it will remove
the tiles that have not been accessed recently until the size of the cache
drops below the given size:
