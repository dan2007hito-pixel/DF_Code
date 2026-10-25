"""Redeem a pasted list of Delta Force codes in a visible Edge browser.

Setup:
    py -m pip install playwright
    py Deltaforce.py

This script does not bypass CAPTCHA or other site checks.
"""

import re
import time
from pathlib import Path
from urllib.parse import urlsplit

from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
from playwright.sync_api import sync_playwright


INPUT_SELECTOR = "input.spr.exc-input"
SUBMIT_SELECTOR = "a.spr.btn-exchange"
DELAY_BETWEEN_CODES_SECONDS = 2.0
RESULT_WAIT_SECONDS = 2.0


def read_codes():
    print("Dán danh sách mã vào đây, mỗi mã một dòng (có thể dùng dấu phẩy/chấm phẩy).")
    print("Nhấn Enter thêm một lần ở dòng trống để kết thúc danh sách:")
    lines = []
    while True:
        try:
            line = input()
        except EOFError:
            break
        if not line.strip():
            break
        lines.append(line)
    return [code.strip() for code in re.split(r"[,;\r\n]+", "\n".join(lines)) if code.strip()]


def dismiss_result(page):
    """Dismiss common browser dialogs or a visible result popup, if present."""
    for label in ("OK", "Đóng", "Đồng ý", "确定", "確定"):
        button = page.get_by_role("button", name=label, exact=True)
        try:
            if button.is_visible(timeout=250):
                button.click(timeout=1000)
                return
        except PlaywrightTimeoutError:
            pass

    for label in ("OK", "Đóng", "Đồng ý"):
        link = page.get_by_text(label, exact=True)
        try:
            if link.is_visible(timeout=250):
                link.click(timeout=1000)
                return
        except PlaywrightTimeoutError:
            pass

    page.keyboard.press("Escape")
    page.wait_for_timeout(200)
    try:
        page.mouse.click(2, 2)
    except PlaywrightTimeoutError:
        pass


def main():
    codes = read_codes()
    if not codes:
        print("Chưa có mã nào được nhập.")
        return

    url = input("Dán URL trang đổi mã đang dùng: ").strip()
    parsed_url = urlsplit(url)
    if parsed_url.scheme != "https" or parsed_url.netloc.lower() != "redeem.df.garena.sg":
        print("URL không hợp lệ. Hãy dùng trang redeem.df.garena.sg chính thức.")
        return

    with sync_playwright() as playwright:
        profile_dir = Path(__file__).with_name("edge_profile")
        context = playwright.chromium.launch_persistent_context(
            user_data_dir=str(profile_dir),
            channel="msedge",
            headless=False,
        )
        page = context.pages[0] if context.pages else context.new_page()
        page.on("dialog", lambda dialog: dialog.accept())
        page.goto(url, wait_until="domcontentloaded")

        print("Nếu trang yêu cầu đăng nhập hoặc xác minh, hãy hoàn tất trên cửa sổ trình duyệt.")
        input("Khi trang đổi mã đã sẵn sàng, nhấn Enter ở terminal để bắt đầu...")

        input_box = page.locator(INPUT_SELECTOR)
        submit = page.locator(SUBMIT_SELECTOR)

        for index, code in enumerate(codes, start=1):
            print(f"Đang gửi mã {index}/{len(codes)}...")
            input_box.wait_for(state="visible", timeout=30000)
            input_box.fill(code)
            page.wait_for_timeout(400)
            submit.click()
            page.wait_for_timeout(int(RESULT_WAIT_SECONDS * 1000))
            dismiss_result(page)

            if index < len(codes):
                time.sleep(DELAY_BETWEEN_CODES_SECONDS)

        print("Đã gửi hết danh sách mã. Hãy xem kết quả trên trang.")
        input("Nhấn Enter để đóng trình duyệt...")
        context.close()


if __name__ == "__main__":
    main()
