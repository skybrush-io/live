import * as React from "react";
import * as ReactDOM from "react-dom";

import HelloComponent from "./hello-component";

ReactDOM.render(
    <HelloComponent compiler="TypeScript" framework="React" />,
    document.getElementById("root")
);