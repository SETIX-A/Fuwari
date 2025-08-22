import type {
	ExpressiveCodeConfig,
	LicenseConfig,
	NavBarConfig,
	ProfileConfig,
	SiteConfig,
} from "./types/config";
import { LinkPreset } from "./types/config";

export const siteConfig: SiteConfig = {
	title: "Setix", //站点标题
	subtitle: "我的个人博客和想法", //副标题
	lang: "zh_CN", // Language code, e.g. 'en', 'zh_CN', 'ja', etc.
	themeColor: {
		hue: 250, // Default hue for the theme color, from 0 to 360. e.g. red: 0, teal: 200, cyan: 250, pink: 345
		fixed: false, // Hide the theme color picker for visitors
	},
	banner: {
		enable: true, // 修改为 true 后即可在主页显示图片，src后要改为图片的链接；不开启选择 false
		src: "assets/images/demo-banner.jpg", // Relative to the /src directory. Relative to the /public directory if it starts with '/'
		position: "center", // Equivalent to object-position, only supports 'top', 'center', 'bottom'. 'center' by default
		credit: {
			enable: true, // Display the credit text of the banner image
			text: "TOKKYU/水中", // Credit text to be displayed
			url: "https://www.pixiv.net/artworks/133074580", // (Optional) URL link to the original artwork or artist's page
		},
	},
	toc: {
		enable: true, // Display the table of contents on the right side of the post
		depth: 2, // Maximum heading depth to show in the table, from 1 to 3
	},
	favicon: [
		// Leave this array empty to use the default favicon
		// {
		//   src: '/favicon/icon.png',    // Path of the favicon, relative to the /public directory
		//   theme: 'light',              // (Optional) Either 'light' or 'dark', set only if you have different favicons for light and dark mode
		//   sizes: '32x32',              // (Optional) Size of the favicon, set only if you have favicons of different sizes
		// }
	],
};

export const navBarConfig: NavBarConfig = {
	links: [
		{ name: "首页", url: "/" }, // LinkPreset.Home
		{ name: "归档", url: "/archive" }, // LinkPreset.Archive
		{ name: "关于", url: "/about" },
	],
};

export const profileConfig: ProfileConfig = {
	avatar: "assets/images/demo-avatar.png", // Relative to the /src directory. Relative to the /public directory if it starts with '/'
	name: "Setix", // 你的名字或昵称
	bio: "这里是一个关于人工智能、心理学、编程、经济学、数学和社会系统的思考空间。愿它能引发你的片刻思索。",
	links: [
		{
			name: "X",
			icon: "fa6-brands:square-x-twitter", // Visit https://icones.js.org/ for icon codes
			// You will need to install the corresponding icon set if it's not already included
			// `pnpm add @iconify-json/<icon-set-name>`
			url: "https://x.com/SETIX_A",
		},
		{
			name: "Mail",
			icon: "ic:baseline-mail",
			url: "mailto:Socrates.02zx@Gmail.com",
		},
		{
			name: "GitHub",
			icon: "fa6-brands:square-github",
			url: "https://github.com/SETIX-A/Fuwari",
		},
	],
};

export const licenseConfig: LicenseConfig = {
	enable: true,
	name: "CC BY-NC-SA 4.0",
	url: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
};

export const expressiveCodeConfig: ExpressiveCodeConfig = {
	// Note: Some styles (such as background color) are being overridden, see the astro.config.mjs file.
	// Please select a dark theme, as this blog theme currently only supports dark background color
	theme: "github-dark",
};
