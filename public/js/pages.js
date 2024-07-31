(() => {
    if (!window.app) window.app = {};

    // Mobile
    window.app.registerMobilePages = () => {
        var sidebarLinks = document.querySelectorAll('#mobile-sidebar a');

        for (var i = 0; i < sidebarLinks.length; i++) {
            sidebarLinks[i].addEventListener('click', function (e) {
                e.preventDefault();

                var pageName = this.id.replace('sidebar-', '');
                pageName = pageName.replace('mobile-', '');
                console.log(pageName);
                var page = document.getElementById(`pages-${pageName}`);
                var pages = document.querySelectorAll('[id^="pages-"]');

                for (var p of pages) {
                    // Reset sidebar
                    var thisPageName = p.id.replace('pages-', '');
                    var thisPageSidebar = document.getElementById(`mobile-sidebar-${thisPageName}`);
                    thisPageSidebar.classList.value = 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md'

                    // Hide all pages
                    p.style.display = 'none';
                }

                // Highlight sidebar
                this.classList.value = 'bg-gray-100 text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md';
                page.style.display = 'block';

                // Set window and page title
                document.getElementById('main-title').innerText = pageName.charAt(0).toUpperCase() + pageName.slice(1);
                document.title = `${pageName.charAt(0).toUpperCase() + pageName.slice(1)} - Panel`;

                // Set location 
                window.history.pushState({ page: pageName }, pageName, `/${pageName}`);

                // Set window and page title
                if (pageName == 'home') {
                    document.getElementById('main-title').innerText = `${window.app.getTimeIntroduction()}, ${window.app.user.name} 👋`;
                } else {
                    document.getElementById('main-title').innerText = pageName.charAt(0).toUpperCase() + pageName.slice(1);
                }
                document.title = `${pageName.charAt(0).toUpperCase() + pageName.slice(1)} - Panel`;

                // Set location 
                window.history.pushState({ page: pageName }, pageName, `/${pageName}`);

                // Set overlay size
                var overlay = document.getElementById('main-overlay');
                overlay.classList.value = 'w-full py-6 bg-blue-600';
                if (pageName == 'payables' || pageName == 'print') {
                    overlay.classList.add('pb-16');
                } else if (pageName == 'home' || pageName == 'balance') {
                    console.log('here');
                    overlay.classList.add('pb-44');
                } else {
                    overlay.classList.add('pb-24');
                }

                // Close sidebar
                document.getElementById('mobile-sidebar-main').style.display = 'none';
            });
        }

        // Sidebar close/open
        document.querySelector('#mobile-close-sidebar').addEventListener('click', function () {
            document.getElementById('mobile-sidebar-main').style.display = 'none';
        });

        document.querySelector('#mobile-open-sidebar').addEventListener('click', function () {
            document.getElementById('mobile-sidebar-main').style.display = 'flex';
        });
    }

    // Desktop
    window.app.registerPages = () => {
        var sidebarLinks = document.querySelectorAll('#sidebar a');

        for (var i = 0; i < sidebarLinks.length; i++) {
            sidebarLinks[i].addEventListener('click', function (e) {
                e.preventDefault();

                var pageName = this.id.replace('sidebar-', '');
                var page = document.getElementById(`pages-${pageName}`)
                var pages = document.querySelectorAll('[id^="pages-"]');

                for (var p of pages) {
                    // Reset sidebar
                    var thisPageName = p.id.replace('pages-', '');
                    var thisPageSidebar = document.getElementById(`sidebar-${thisPageName}`);
                    thisPageSidebar.classList.value = 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md'

                    // Hide all pages
                    p.style.display = 'none';
                }

                // Highlight sidebar
                this.classList.value = 'bg-gray-100 text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md';
                page.style.display = 'block';

                // Set window and page title
                if (pageName == 'home') {
                    document.getElementById('main-title').innerText = `${window.app.getTimeIntroduction()}, ${window.app.user.name} 👋`;
                } else {
                    document.getElementById('main-title').innerText = pageName.charAt(0).toUpperCase() + pageName.slice(1);
                }
                document.title = `${pageName.charAt(0).toUpperCase() + pageName.slice(1)} - Panel`;

                // Set location 
                window.history.pushState({ page: pageName }, pageName, `/${pageName}`);

                // Set overlay size
                var overlay = document.getElementById('main-overlay');
                overlay.classList.value = 'w-full py-6 bg-blue-600';
                if (pageName == 'payables' || pageName == 'print') {
                    overlay.classList.add('pb-16');
                } else if (pageName == 'home' || pageName == 'balance') {
                    console.log('here');
                    overlay.classList.add('pb-44');
                } else {
                    overlay.classList.add('pb-24');
                }
            });
        }
    }

    window.app.gotoPage = (pageName) => {
        document.getElementById(`sidebar-${pageName}`).click();
    }

    window.app.registerPages();
    window.app.registerMobilePages();

    // Check if there is a page in the URL
    var pageName = window.location.pathname.replace('/', '');
    if (pageName != 'home' && pageName != '') {
        window.app.gotoPage(pageName);
    }

})();