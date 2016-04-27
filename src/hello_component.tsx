interface Props {
	compiler: string;
	framework: string;
}

class HelloComponent extends React.Component<Props, {}> {
	render() {
		return <div><div>{props.compiler}</div><div>{props.framework}</div></div>;
	}
}
