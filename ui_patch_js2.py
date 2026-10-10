import codecs
import re

with codecs.open('frontend/js/admin-report.js', 'r', 'utf-8') as f:
    code = f.read()

# The block to remove:
# container.innerHTML = `
#    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
#        <button ...>...</button>
#    </div>
#    ...
# `
# We just need to remove the button part so it doesn't render twice.

old_block_pattern = re.compile(
    r'<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">\s*'
    r'<button class="action-btn" style="background: var\(--brand\).*?</button>\s*'
    r'</div>',
    re.DOTALL
)

code = old_block_pattern.sub('', code)

with codecs.open('frontend/js/admin-report.js', 'w', 'utf-8') as f:
    f.write(code)
print("Removed old button")
