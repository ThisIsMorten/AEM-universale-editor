export const getProgramIdFromDomain = (domain) => {
    const match = domain.match(/author-p(\d+)-/);
    return match ? match[1] : null;
}