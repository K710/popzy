Popzy.elements = [];

// Modal Constructor
function Popzy(options = {}) {
    this.opt = Object.assign(
        {
            footer: false,
            closeMethods: ["button", "overlay", "escape"],
            destroyOnClose: true,
            cssClass: [],
        },
        options
    );
    // Destructure các options truyền vào

    // Tìm template theo ID
    this.template = document.querySelector(`#${this.opt.templateId}`);
    if (!this.template) {
        console.error(`${this.opt.templateId} does not exist!`);
        return;
    }

    // Các flags xác định modal được đóng theo cách nào
    const { closeMethods } = this.opt;
    this._allowButtonClose = closeMethods.includes("button");
    this._allowBackdropClose = closeMethods.includes("overlay");
    this._allowEscapeClose = closeMethods.includes("escape");
    this._footerButtons = [];
    this._handleEscape = this._handleEscape.bind(this);

    // Hàm tính toán chiều rộng scrollbar (dùng để fix nhảy layout khi disable scroll)
    Popzy.prototype._getScrollbarWidth = function () {
        if (this._scrollbarWidth) return this._scrollbarWidth;
        const div = document.createElement("div");
        Object.assign(div.style, {
            overflow: "scroll",
            position: "absolute",
            top: "-9999px",
        });
        document.body.appendChild(div);
        this._scrollbarWidth = div.offsetWidth - div.clientWidth;
        document.body.removeChild(div);
        return this._scrollbarWidth;
    };
}

// Xây dựng DOM cho modal
Popzy.prototype._build = function () {
    let content = this.template.content.cloneNode(true);

    // Backdrop
    this._backdrop = document.createElement("div");
    this._backdrop.className = "modal-backdrop";

    // Container
    const container = document.createElement("div");
    container.className = "modal-container";

    // Thêm class tùy chỉnh
    this.opt.cssClass.forEach((className) => {
        if (typeof className === "string") {
            container.classList.add(className);
        }
    });

    // Nút đóng (nếu cho phép)
    if (this._allowButtonClose) {
        const closeBtn = this.createButton("modal-close", "&times;", () =>
            this.close()
        );

        container.append(closeBtn);
    }

    // Nội dung modal
    const modalContent = document.createElement("div");
    modalContent.className = "modal-content";
    modalContent.append(content);

    // Gắn content vào container, rồi vào backdrop
    container.append(modalContent);
    if (this.opt.footer) {
        this._modalFooter = document.createElement("div");
        this._modalFooter.className = "modal-footer";
        this._renderFooterContent();

        this._renderFooterButtons();

        container.append(this._modalFooter);
    }

    this._backdrop.append(container);

    // Thêm vào body
    document.body.append(this._backdrop);
};

Popzy.prototype.createButton = function (title, html, callback) {
    const btn = document.createElement("button");
    btn.className = title;
    btn.innerHTML = html;
    btn.onclick = callback;
    return btn;
};

Popzy.prototype.setFooterContent = function (html) {
    this._footerContent = html;
    this._renderFooterContent();
};

Popzy.prototype._renderFooterContent = function () {
    if (this._modalFooter && this._footerContent) {
        this._modalFooter.innerHTML = this._footerContent;
    }
};

// Mở modal
Popzy.prototype.open = function () {
    Popzy.elements.push(this);
    if (!this._backdrop) {
        this._build();
    }

    // Trigger animation
    setTimeout(() => {
        this._backdrop.classList.add("show");
    }, 0);

    // Disable scroll background
    document.body.classList.add("no-scroll");
    document.body.style.paddingRight = this._getScrollbarWidth() + "px";

    // Đóng bằng ESC
    if (this._allowEscapeClose) {
        document.addEventListener("keydown", this._handleEscape);
    }

    // Đóng bằng click backdrop
    if (this._allowBackdropClose) {
        this._backdrop.onclick = (e) => {
            if (e.target === this._backdrop) {
                this.close();
            }
        };
    }

    this._onTransitionEnd(this.opt.onOpen);

    return this._backdrop;
};

Popzy.prototype._onTransitionEnd = function (callback) {
    this._backdrop.ontransitionend = (e) => {
        if (e.propertyName !== "transform") return;
        if (typeof callback === "function") callback();
    };
};

Popzy.prototype._handleEscape = function (e) {
    console.log(this);
    const lastModal = Popzy.elements[Popzy.elements.length - 1];
    if (e.key === "Escape" && this === lastModal) {
        this.close();
    }
};

// Đóng modal
Popzy.prototype.close = function (destroy = this.opt.destroyOnClose) {
    Popzy.elements.pop();
    this._backdrop.classList.remove("show");
    if (this._allowEscapeClose) {
        document.removeEventListener("keydown", this._handleEscape);
    }

    // Khi animation cancel thì remove luôn
    this._onTransitionEnd(() => {
        if (this._backdrop && destroy) {
            this._backdrop.remove();
            this._backdrop = null;
            this._modalFooter = null;
        }

        if (!Modal.elements.length) {
            document.body.classList.remove("no-scroll");
            document.body.style.paddingRight = "0px";
        }
        // Reset body scroll

        if (typeof this.opt.onClose === "function") {
            this.opt.onClose();
        }
    });
};

Popzy.prototype.addFooterButton = function (title, cssClass, callback) {
    const btnFooter = this.createButton(cssClass, title, callback);
    this._footerButtons.push(btnFooter);

    if (this._modalFooter) {
        this._renderFooterButtons();
    }
};

Popzy.prototype._renderFooterButtons = function () {
    this._footerButtons.forEach((button) => {
        this._modalFooter.append(button);
    });
};
// Hủy hoàn toàn modal
Popzy.prototype.destroy = function () {
    this.close(true);
};
