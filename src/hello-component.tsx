import * as React from "react";

interface Props {
	compiler: string;
	framework: string;
}

export default class HelloComponent extends React.Component<Props, {}> {
	render() {
		return <div><div>{this.props.compiler}</div><div>{this.props.framework}</div></div>;
	}
}
