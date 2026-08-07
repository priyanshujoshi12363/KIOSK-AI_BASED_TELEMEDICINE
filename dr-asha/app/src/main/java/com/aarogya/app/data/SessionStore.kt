package com.aarogya.app.data

import android.content.Context

object SessionStore {
    private const val PREFS = "aarogya_session"

    var token: String? = null
        private set
    var role: String? = null
        private set
    var name: String? = null
        private set

    fun load(context: Context) {
        val p = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        token = p.getString("token", null)
        role = p.getString("role", null)
        name = p.getString("name", null)
    }

    fun save(context: Context, token: String, role: String, name: String?) {
        this.token = token
        this.role = role
        this.name = name
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit()
            .putString("token", token)
            .putString("role", role)
            .putString("name", name)
            .apply()
    }

    fun clear(context: Context) {
        token = null
        role = null
        name = null
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().clear().apply()
    }
}
