import React from 'react';
import ReactDOM from 'react-dom';
import ol from 'openlayers';

export default class MapView extends React.Component {
    componentDidMount() {
        this.map = new ol.Map({
            target: 'map',
            layers: [
                new ol.layer.Tile({
                    source: new ol.source.OSM()
                })
            ],
            view: new ol.View({
                center: ol.proj.fromLonLat(
                    [19.061951, 47.473340],
                    "EPSG:3857"    // Spherical Mercator, as used by OSM
                ),
                zoom: 17
            }),
            loadTilesWhileInteracting: true
        });
    }

    render() {
        return <div id="map" class="map"></div>;
    }
}
