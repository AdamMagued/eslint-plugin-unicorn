import getComments from './get-comments.js';

const getRange = (context, nodeOrRange) =>
	Array.isArray(nodeOrRange) ? nodeOrRange : context.sourceCode.getRange(nodeOrRange);

const isRangeInside = ([start, end], [parentStart, parentEnd]) =>
	start >= parentStart && end <= parentEnd;

/**
Check whether replacing or removing a node or range would remove comments that are not preserved by child nodes or ranges.

@param {import('eslint').Rule.RuleContext} context
@param {object | Array<number>} nodeOrRange
@param {Array<object | Array<number>>} preservedNodeOrRanges
@returns {boolean}
*/
function wouldRemoveComments(context, nodeOrRange, preservedNodeOrRanges = []) {
	const {sourceCode} = context;
	const replacedRange = getRange(context, nodeOrRange);
	const preservedRanges = preservedNodeOrRanges.map(nodeOrRange => getRange(context, nodeOrRange));

	return getComments(context).some(comment => {
		const commentRange = sourceCode.getRange(comment);
		return isRangeInside(commentRange, replacedRange)
			&& preservedRanges.every(range => !isRangeInside(commentRange, range));
	});
}

/**
Get the last trailing comment that starts on the same line where a node or token ends.

@param {import('eslint').Rule.RuleContext} context
@param {object} nodeOrToken
@returns {object | undefined}
*/
function getLastTrailingCommentOnSameLine(context, nodeOrToken) {
	const {sourceCode} = context;
	const nodeOrTokenEndLine = sourceCode.getLoc(nodeOrToken).end.line;

	return sourceCode.getCommentsAfter(nodeOrToken)
		.findLast(comment => sourceCode.getLoc(comment).start.line === nodeOrTokenEndLine);
}

/**
Check whether any comment falls entirely within the given range.

@param {import('eslint').Rule.RuleContext} context
@param {Array<number>} range
@param {((comment: object) => boolean) | {ignore?: (comment: object) => boolean, filter?: (comment: object) => boolean}} [filterOrOptions]
@returns {boolean}
*/
const hasCommentInRange = (context, [start, end], filterOrOptions) => {
	const {sourceCode} = context;
	const filter = typeof filterOrOptions === 'function' ? filterOrOptions : filterOrOptions?.filter;
	const ignore = typeof filterOrOptions === 'object' ? filterOrOptions?.ignore : undefined;

	return getComments(context).some(comment => {
		const [commentStart, commentEnd] = sourceCode.getRange(comment);
		if (commentStart < start || commentEnd > end) {
			return false;
		}

		if (filter && !filter(comment)) {
			return false;
		}

		if (ignore && ignore(comment)) {
			return false;
		}

		return true;
	});
};

export {
	getLastTrailingCommentOnSameLine,
	hasCommentInRange,
	wouldRemoveComments,
};
