import "./similars.sass"
import React from "react";
import {mdiEye} from "@mdi/js";
import {Icon} from "@mdi/react";

import {Connected} from "./connected";
import {service} from "./externals";

import type {Similar} from "./service";

interface Props {
    file: string;
    directory: string;
}

type FileID = string;

interface State {
    enabled?: boolean;
    loadedFile?: FileID;
    similars?: Similar[];
    fault?: string;
}

function getFileId(directory: string, file: string): FileID {
    return `${directory}\n${file}`;
}

export class Similars extends React.PureComponent<Props, State> {
    constructor(props: Props, ...forwarded: unknown[]) {
        super(props, ...forwarded);
        
        this.state = {};

        this.handleToggleEnabled = this.handleToggleEnabled.bind(this);
        this.renderContent = this.renderContent.bind(this);
    }

    private startGetSimilars(directory: string, file: string) {
        if (service.connected() && this.state.enabled)
            service.requestPhashQuery(directory, file).then(response => {
                // See if we won the write
                if (file == this.props.file && directory == this.props.directory) {
                    this.setState({
                        loadedFile: getFileId(directory, file),
                        similars: response,
                    });
                }
            },
            (err: Error) => {
                this.setState({
                    loadedFile: getFileId(directory, file),
                    fault: err.message,
                });
            });
    }

    componentDidUpdate(p: Props, s: State): void {
        const {file, directory} = this.props;
        if (this.state.loadedFile !== getFileId(directory, file))
            this.startGetSimilars(directory, file);
    }

    private renderThumbnail(s: Similar): React.ReactNode {
        const url = service.getThumbnailPath(s.group, s.index);
        return <>
            <img src={url} alt="" />
            <div>{s.group}-{s.index} (&Delta;: {s.diff}/64)</div>
        </>;
    }

    private renderContent(connected: boolean): React.ReactNode {
        if (!connected)
            return <div>Not connected</div>;

        const {directory, file} = this.props;
        if (getFileId(directory, file) !== this.state.loadedFile)
            return <div>Loading</div>;

        if (this.state.fault)
            return <div>{this.state.fault}</div>;
        
        if (this.state.similars)
            return <ul>
                {this.state.similars.map(s => <li key={`${s.group}/${s.index}`}>
                    {this.renderThumbnail(s)}
                </li>)}
            </ul>;

        return <div>No results</div>;
    }

    render() {
        const {enabled} = this.state;
        const className = enabled
            ? "curator similars enabled"
            : "curator similars";

        return <span className={className}>
            <div>
                <button onClick={this.handleToggleEnabled}>
                    <Icon path={mdiEye} />
                </button>
            </div>
            <span className="background">
                {enabled && <Connected>{this.renderContent}</Connected>}
            </span>
        </span>;
    }

    handleToggleEnabled(): void {
        this.setState(({enabled}) => ({enabled: !enabled}));
    }
}