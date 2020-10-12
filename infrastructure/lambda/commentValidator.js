exports.handler = async ({ content }) => {
    const badEmojis = ['🖕', '💩'];

    let hasBadEmojis = false;
    badEmojis.forEach(badEmoji => {
        if (content.indexOf(badEmoji) !== -1) {
            hasBadEmojis = true;
        }
    })
    return { hasBadEmojis }
};
