declare module 'editorconfig' {

	export interface KnownProps {
		end_of_line?: 'lf' | 'crlf' | 'unset';
		indent_style?: 'tab' | 'space' | 'unset';
		indent_size?: number | 'tab' | 'unset';
		insert_final_newline?: true | false | 'unset';
		tab_width?: number | 'unset';
		trim_trailing_whitespace?: true | false | 'unset';
		charset?: string | 'unset';
	}

	export interface Options {
		config: string;
		version: string;
		root: string;
	}

	export function parse(
		filepath: string,
		options?: Options
	): Promise<KnownProps>;
}
